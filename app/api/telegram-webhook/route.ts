import { NextRequest, NextResponse } from "next/server";
import { Markup } from "telegraf";
import { formatUnits } from "viem";
import {
  getAllExchangeRequests,
  getAllInternalRequests,
  getExchangeRequestById,
  getInternalRequestById,
  updateExchangeRequestStatus,
  updateExchangeRequestStage,
  updateInternalRequestStatus,
  updateInternalRequestStage,
  createChatbotMessage,
  getChatbotSessionById,
} from "@/lib/database/queries";
import {
  getInternalBalanceSnapshot,
  getWithdrawRequestById,
  listActiveWithdrawRequestsByUserId,
  refundActiveWithdrawRequestsForUser,
  refundWithdrawRequestToBalance,
  type WithdrawRefundResult,
  type WithdrawRequestWithUser,
} from "@/lib/database/internal-balance-queries";
import { createSupportMessage, getLatestSessionByWallet } from "@/lib/database/support-queries";
import { getUserById } from "@/lib/database/user-queries";
import { query } from "@/lib/database/db";
import { TOKEN_CONFIG } from "@/config/token";
import {
  formatChatHistoryForTelegram,
  isValidWalletAddress,
  sanitizeMessageText,
  escapeMarkdown,
} from "@/lib/telegram/notify-admin";
import { getBot } from "@/lib/telegram/bot";
import { Telegraf, Context } from "telegraf";

// Bot instance - will be null during build if TELEGRAM_API_KEY is not set
// This is OK - the bot is only needed at runtime when webhook is called
let bot: Telegraf | null = null;
try {
  bot = getBot();
} catch {
  // During build time, TELEGRAM_API_KEY might not be set
  // This is fine - bot will only be used at runtime
  console.log("[telegram-webhook] Bot not initialized (probably during build)");
  bot = null;
}

// Store the app URL from the last request (for use in bot handlers)
let cachedAppUrl: string | null = null;

// Helper function to get app URL
// Determines production URL from request headers or environment variable
function getAppUrl(request?: NextRequest): string {
  // Try to get URL from environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    cachedAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    console.log("[telegram-webhook] Using URL from NEXT_PUBLIC_APP_URL:", cachedAppUrl);
    return cachedAppUrl;
  }

  // In production, try to get from request headers
  if (request) {
    const host = request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    if (host) {
      const url = `${protocol}://${host}`;
      cachedAppUrl = url;
      console.log("[telegram-webhook] Using URL from request headers:", url);
      return url;
    }
  }

  // Use cached URL if available
  if (cachedAppUrl) {
    console.log("[telegram-webhook] Using cached URL:", cachedAppUrl);
    return cachedAppUrl;
  }

  // Fallback for production
  if (process.env.NODE_ENV === "production") {
    const url = "https://www.euro-coin.eu";
    console.log("[telegram-webhook] Using production fallback URL:", url);
    return url;
  }

  // Fallback for development
  const url = "http://localhost:3000";
  console.log("[telegram-webhook] Using development fallback URL:", url);
  return url;
}

// =============================================================================
// Authorization Middleware
// =============================================================================

/**
 * Check if a user is authorized to use the bot
 * @param userId - Telegram User ID to check
 * @returns true if authorized, false otherwise
 */
function isAuthorizedUser(userId: number): boolean {
  const allowedUserId = process.env.TELEGRAM_ALLOWED_USER_ID;

  if (!allowedUserId) {
    console.warn(
      "[telegram-webhook] ⚠️  TELEGRAM_ALLOWED_USER_ID is not set!\n" +
        "Bot is open to all users. Add it to .env.local:\n" +
        "TELEGRAM_ALLOWED_USER_ID=your_user_id",
    );
    // Return false in production if not set for security
    return process.env.NODE_ENV !== "production";
  }

  const isAuthorized = userId.toString() === allowedUserId;

  if (!isAuthorized) {
    console.log(`[telegram-webhook] 🚫 Unauthorized access attempt from User ID: ${userId}`);
  }

  return isAuthorized;
}

/**
 * Check access and reply with error message if unauthorized
 * @param ctx - Telegraf context
 * @returns true if authorized, false otherwise
 */
async function checkAccess(ctx: Context): Promise<boolean> {
  const userId = ctx.from?.id;

  if (!userId) {
    console.warn("[telegram-webhook] ⚠️  No user ID in context");
    return false;
  }

  if (!isAuthorizedUser(userId)) {
    await ctx
      .reply(
        "🔒 У вас нет доступа к этому боту.\n\n" +
          "Этот бот доступен только для авторизованных администраторов.\n" +
          "Если вы считаете, что это ошибка, обратитесь к владельцу бота.",
      )
      .catch((err: Error) => {
        console.error("[telegram-webhook] Failed to send unauthorized message:", err);
      });
    return false;
  }

  return true;
}

// Helper function to call webhook
async function updateRequestStatus(requestId: string, status: string, request?: NextRequest) {
  try {
    const appUrl = getAppUrl(request);
    const response = await fetch(`${appUrl}/api/webhook/update-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status }),
    });

    if (!response.ok) {
      console.error("Failed to update request status via webhook");
    }
  } catch (error) {
    console.error("Error calling webhook:", error);
  }
}

// Helper function to format status badge
function getStatusBadge(status: string): string {
  const badges = {
    pending: "⏳",
    processing: "🔄",
    completed: "✅",
    rejected: "❌",
    cancelled: "🚫",
  };
  return badges[status as keyof typeof badges] || "⏳";
}

// Helper function to get status name in Russian
function getStatusName(status: string): string {
  const names = {
    pending: "В обработке",
    approved: "Одобрена",
    processing: "Выполняется",
    completed: "Завершена",
    rejected: "Отклонена",
    cancelled: "Отменена",
    failed: "Ошибка/возврат",
  };
  return names[status as keyof typeof names] || status;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_DECIMALS =
  Number.isFinite(TOKEN_CONFIG.decimals) && Number(TOKEN_CONFIG.decimals) > 0
    ? Number(TOKEN_CONFIG.decimals)
    : 18;

function formatTokenMinorAmount(amount: string, decimals = TOKEN_DECIMALS): string {
  try {
    return formatUnits(BigInt(amount), decimals);
  } catch {
    return amount;
  }
}

function getAdminActor(ctx: Context): string {
  const firstName = ctx.from?.first_name;
  const username = ctx.from?.username;
  const telegramId = ctx.from?.id;
  const label = firstName || username || "admin";
  return telegramId ? `${label} (Telegram ID: ${telegramId})` : label;
}

function formatWithdrawRequestDetails(request: WithdrawRequestWithUser): string {
  const statusLabel = getStatusName(request.status);
  const txLine = request.txHash ? `🔗 *Tx Hash:* \`${escapeMarkdown(request.txHash)}\`\n` : "";
  const notesLine = request.notes ? `📝 *Примечания:* ${escapeMarkdown(request.notes)}\n` : "";
  const userIdLine = request.userId
    ? `🆔 *ID пользователя:* \`${escapeMarkdown(request.userId)}\`\n`
    : "";
  const feeLine = request.feeAmount
    ? `💸 *Комиссия:* ${escapeMarkdown(formatTokenMinorAmount(request.feeAmount))} ${escapeMarkdown(
        request.tokenSymbol,
      )}\n`
    : `💸 *Комиссия:* не установлена\n`;

  return `
📋 *Детали заявки на вывод*

🧾 *ID:* WR\\-${escapeMarkdown(request.id)}
${userIdLine}💼 *Кошелек:* \`${escapeMarkdown(request.walletAddress || "N/A")}\`
🎯 *Адрес вывода:* \`${escapeMarkdown(request.destinationAddress)}\`
💰 *Сумма:* ${escapeMarkdown(formatTokenMinorAmount(request.amount))} ${escapeMarkdown(
    request.tokenSymbol,
  )}
${feeLine}📊 *Статус:* ${escapeMarkdown(statusLabel)}
${txLine}${notesLine}📅 *Создана:* ${escapeMarkdown(new Date(request.createdAt).toLocaleString("ru-RU"))}
🕐 *Обновлена:* ${escapeMarkdown(new Date(request.updatedAt).toLocaleString("ru-RU"))}
  `.trim();
}

function formatWithdrawRequestLine(request: WithdrawRequestWithUser): string {
  return (
    `WR-${request.id}\n` +
    `Статус: ${getStatusName(request.status)}\n` +
    `Сумма: ${formatTokenMinorAmount(request.amount)} ${request.tokenSymbol}\n` +
    `Адрес: ${request.destinationAddress}\n` +
    `Создана: ${new Date(request.createdAt).toLocaleString("ru-RU")}`
  );
}

function formatRefundResults(results: WithdrawRefundResult[]): string {
  if (results.length === 0) {
    return "Нет активных заявок для возврата.";
  }

  return results
    .map((result) => {
      const amount = `${formatTokenMinorAmount(result.amount)} ${result.tokenSymbol}`;
      if (result.action === "skipped") {
        return `• WR-${result.requestId}: пропущена (${getStatusName(result.status)}), ${amount}`;
      }
      const action =
        result.action === "cancelled"
          ? "резерв освобожден"
          : "отмечена failed, сумма возвращена";
      return `• WR-${result.requestId}: ${getStatusName(result.previousStatus)} → ${getStatusName(
        result.status,
      )}, ${action}, ${amount}`;
    })
    .join("\n");
}

// =============================================================================
// Bot Handlers Registration (only if bot is initialized)
// =============================================================================

if (bot) {
  // Start command
  bot.start(async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) return;

    const chatId = ctx.chat.id;
    const username = ctx.from.first_name || "User";

    ctx.reply(
      `Привет, ${username}! 👋\n\n` +
        `Я бот для обработки заявок на обмен токенов.\n\n` +
        `Ваш ID: ${chatId}\n\n` +
        `Используйте команды:\n` +
        `/list - показать все заявки\n` +
        `/exchange - показать заявки на обмен\n` +
        `/internal - показать внутренние заявки\n` +
        `/details <ID> - детали заявки\n` +
        `/credit - начислить баланс пользователю\n\n` +
        `/refund <userId|WR_ID> - вернуть активный вывод на баланс\n\n` +
        `Пример: /details EX-1234567890\n\n` +
        `Используйте /help для подробной справки.`,
    );
  });

  // My ID command - to get chat ID for TELEGRAM_ADMIN_CHAT_ID
  bot.command("myid", (ctx) => {
    const chatId = ctx.chat.id;
    const username = ctx.from?.username || "Unknown";
    const firstName = ctx.from?.first_name || "Unknown";

    ctx.reply(
      `🆔 *Ваш Chat ID:* \`${chatId}\`\n\n` +
        `👤 Username: @${username}\n` +
        `👤 Name: ${firstName}\n\n` +
        `📝 Добавьте этот Chat ID в .env.local:\n` +
        `\`TELEGRAM_ALLOWED_USER_ID=${chatId}\`\n` +
        `_или_ \`TELEGRAM_ADMIN_CHAT_ID=${chatId}\` для обратной совместимости`,
      { parse_mode: "Markdown" },
    );
  });

  // Help command
  bot.command("help", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) return;

    const helpMessage = `
🤖 *Справка по командам бота*

📋 *Основные команды:*

/start - Начать работу с ботом
  ➡️ Приветственное сообщение с кратким обзором возможностей бота
  ➡️ Показывает ваш Chat ID и список основных команд

/help - Показать эту справку
  ➡️ Отображает полный список всех доступных команд с подробными описаниями
  ➡️ Помогает быстро найти нужную команду и понять её назначение

/myid - Узнать свой Chat ID
  ➡️ Показывает ваш уникальный Telegram Chat ID
  ➡️ Необходим для настройки доступа к боту в .env.local
  ➡️ Используется для переменной TELEGRAM_ALLOWED_USER_ID

/cancel - Отменить текущую операцию
  ➡️ Отменяет активный процесс (отправка сообщения, начисление баланса, установка комиссии, рассылка)
  ➡️ Полезно, если вы передумали или случайно начали операцию
  ➡️ Работает только во время активных диалогов

📊 *Команды для просмотра заявок:*

/list - Показать все заявки (обмен + внутренние)
  ➡️ Выводит краткий список последних 5 заявок каждого типа с их статусами
  ➡️ Быстрый обзор всех активных заявок в системе
  ➡️ Показывает ID, статус и основную информацию

/exchange - Показать заявки на обмен с кнопками управления
  ➡️ Отображает все заявки на обмен с возможностью изменения статуса через inline-кнопки
  ➡️ Поддерживает кнопки: Обработать, Завершить, Отклонить, Отменить
  ➡️ Показывает до 10 последних заявок с полной информацией
  ➡️ Удобно для быстрого управления заявками на обмен токенов

/internal - Показать внутренние заявки с кнопками управления
  ➡️ Отображает все внутренние заявки с возможностью изменения статуса
  ➡️ Поддерживает кнопки: Обработать, Завершить, Отклонить
  ➡️ Показывает до 10 последних заявок с информацией о запрашивающем и отделе
  ➡️ Идеально для управления внутренними запросами компании

/details <ID> - Показать детали конкретной заявки
  ➡️ Подробная информация о заявке по её ID
  ➡️ Пример: /details EX-1234567890 или /details IR-1234567890
  ➡️ Отображает полную информацию: статус, даты, суммы, адреса, комментарии
  ➡️ Включает кнопки для быстрого изменения статуса заявки

/chats - Показать активные чат-сессии
  ➡️ Отображает информацию об активных сессиях чатбота и поддержки
  ➡️ Позволяет просматривать историю переписки с пользователями
  ➡️ Поддерживает ответы через кнопку "Ответить" или формат [reply-SESSION_ID]

💰 *Команды для управления балансом:*

/credit - Начислить баланс пользователю
  ➡️ Пошаговое начисление баланса через интерактивный диалог
  ➡️ Поддерживает начисление по адресу кошелька или ID пользователя
  ➡️ Требует: адрес кошелька (0x...) или ID пользователя (UUID), сумму, описание (опционально)
  ➡️ Пример использования:
     1. /credit
     2. Введите адрес кошелька (0x...) или ID пользователя (UUID)
     3. Введите сумму (например: 100.5)
     4. Введите описание или "-" для пропуска
     5. Подтвердите начисление через кнопку
  ➡️ Баланс отображается в личном кабинете пользователя
  ➡️ Безопасное начисление с подтверждением перед выполнением

/refund <userId|WR_ID> - Вернуть активный вывод на внутренний баланс
  ➡️ По ID пользователя показывает все активные выводы и кнопку подтверждения возврата
  ➡️ По ID заявки показывает детали и кнопку "Вернуть на баланс"
  ➡️ Поддерживает только pending, approved и processing заявки
  ➡️ Пример: /refund ee09fbea-b502-4280-b4e5-c52eb27a6839

📧 *Команды для рассылки:*

/subscribe - Подписаться на рассылку новостей
  ➡️ Подписка на получение новостей и обновлений о EuroCoin
  ➡️ Вы будете получать важные уведомления и анонсы
  ➡️ Можно отписаться в любой момент командой /unsubscribe

/unsubscribe - Отписаться от рассылки
  ➡️ Отмена подписки на рассылку новостей
  ➡️ Вы перестанете получать уведомления
  ➡️ Можно подписаться снова командой /subscribe

/newsletter - Отправить рассылку подписчикам (только для менеджера)
  ➡️ Отправка рассылки всем подписчикам с подтвержденным email
  ➡️ Доступна только для пользователя с TELEGRAM_MANAGER_CHAT_ID
  ➡️ Поддерживает отправку текста, изображений с подписью, видео и документов
  ➡️ Использование:
     1. /newsletter
     2. Отправьте контент (текст, фото с подписью, видео или документ)
     3. Подтвердите отправку через кнопку
  ➡️ Безопасная рассылка с предварительным просмотром и подтверждением

⚙️ *Изменить статус заявки:*

1. Используйте /exchange, /internal или /details <ID>
2. Выберите заявку с нужным статусом
3. Нажмите на одну из кнопок:
   🔄 Обработать (processing) - Заявка взята в работу
   ✅ Завершить (completed) - Заявка успешно завершена
   ❌ Отклонить (rejected) - Заявка отклонена
   🚫 Отменить (cancelled) - Заявка отменена

📈 *Статусы заявок:*

⏳ В обработке (pending) - Заявка ожидает обработки
🔄 Выполняется (processing) - Заявка в процессе выполнения
✅ Завершена (completed) - Заявка успешно завершена
❌ Отклонена (rejected) - Заявка отклонена
🚫 Отменена (cancelled) - Заявка отменена

💡 *Подсказки:*

• ID заявки начинается с EX- (для обмена) или IR- (для внутренних)
• При изменении статуса через бота, изменения автоматически синхронизируются на сайте
• Вы получите уведомление об изменении статуса
• Для ответа пользователю в чате используйте кнопку "Ответить" или формат [reply-SESSION_ID]
• Все операции с балансом требуют подтверждения перед выполнением
• Команда /cancel работает только во время активных диалогов
`;

    ctx.reply(helpMessage, { parse_mode: "Markdown" });
  });

  // List all requests
  bot.command("list", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) return;

    try {
      const [exchangeRequests, internalRequests] = await Promise.all([
        getAllExchangeRequests(),
        getAllInternalRequests(),
      ]);

      if (exchangeRequests.length === 0 && internalRequests.length === 0) {
        ctx.reply("📭 Нет заявок");
        return;
      }

      let message = "📋 *Все заявки:*\n\n";

      if (exchangeRequests.length > 0) {
        message += "💱 *Заявки на обмен:*\n";
        exchangeRequests.slice(0, 5).forEach((req) => {
          const badge = getStatusBadge(req.status);
          const statusName = getStatusName(req.status);
          message += `${badge} ${req.id} - ${statusName} (${req.token_amount} TOKEN)\n`;
        });
        if (exchangeRequests.length > 5) {
          message += `...и еще ${exchangeRequests.length - 5} заявок\n`;
        }
        message += "\n";
      }

      if (internalRequests.length > 0) {
        message += "📝 *Внутренние заявки:*\n";
        internalRequests.slice(0, 5).forEach((req) => {
          const badge = getStatusBadge(req.status);
          const statusName = getStatusName(req.status);
          message += `${badge} ${req.id} - ${statusName} (${req.department})\n`;
        });
        if (internalRequests.length > 5) {
          message += `...и еще ${internalRequests.length - 5} заявок\n`;
        }
      }

      ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error in /list command:", error);
      ctx.reply("❌ Ошибка при получении заявок");
    }
  });

  // List exchange requests
  bot.command("exchange", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) return;

    try {
      const requests = await getAllExchangeRequests();

      if (requests.length === 0) {
        ctx.reply("💱 Нет заявок на обмен");
        return;
      }

      let message = "💱 *Заявки на обмен:*\n\n";
      requests.slice(0, 10).forEach((req) => {
        const badge = getStatusBadge(req.status);
        const statusName = getStatusName(req.status);
        const wallet = req.wallet_address.slice(0, 10) + "...";
        message += `${badge} *${req.id}*\n`;
        message += `💰 ${req.token_amount} TOKEN → ${req.fiat_amount} EUR\n`;
        message += `📊 ${req.rate}\n`;
        message += `💼 ${wallet}\n`;
        message += `📧 ${req.email}\n`;
        message += `📊 Статус: ${statusName}\n`;

        // Add action buttons
        const keyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback("🔄 Обработать", `action_${req.id}_processing`),
            Markup.button.callback("✅ Завершить", `action_${req.id}_completed`),
          ],
          [
            Markup.button.callback("❌ Отклонить", `action_${req.id}_rejected`),
            Markup.button.callback("🚫 Отменить", `action_${req.id}_cancelled`),
          ],
        ]);

        ctx.reply(message, { parse_mode: "Markdown", ...keyboard });
      });
    } catch (error) {
      console.error("Error in /exchange command:", error);
      ctx.reply("❌ Ошибка при получении заявок");
    }
  });

  // List internal requests
  bot.command("internal", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) return;

    try {
      const requests = await getAllInternalRequests();

      if (requests.length === 0) {
        ctx.reply("📝 Нет внутренних заявок");
        return;
      }

      requests.slice(0, 10).forEach((req) => {
        const badge = getStatusBadge(req.status);
        const statusName = getStatusName(req.status);
        let message = `${badge} *${req.id}*\n`;
        message += `👤 ${req.requester}\n`;
        message += `🏢 ${req.department}\n`;
        message += `📋 ${req.request_type}\n`;
        message += `⭐ Приоритет: ${req.priority}\n`;
        message += `📊 Статус: ${statusName}\n`;
        message += `📝 ${req.description.slice(0, 100)}...\n`;

        // Add action buttons
        const keyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback("🔄 Обработать", `action_${req.id}_processing`),
            Markup.button.callback("✅ Завершить", `action_${req.id}_completed`),
          ],
          [Markup.button.callback("❌ Отклонить", `action_${req.id}_rejected`)],
        ]);

        ctx.reply(message, { parse_mode: "Markdown", ...keyboard });
      });
    } catch (error) {
      console.error("Error in /internal command:", error);
      ctx.reply("❌ Ошибка при получении заявок");
    }
  });

  // Chats command - show active chatbot sessions
  bot.command("chats", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) return;

    try {
      // For now, return a simple response
      // In full implementation, this would query the database
      ctx.reply(
        "💬 *Активные чат-сессии*\n\n" +
          "Эта функция будет доступна после подключения базы данных.\n\n" +
          "Для ответа пользователю используйте формат:\n" +
          "`[reply-SESSION_ID] Ваш ответ`\n\n" +
          "Пример:\n" +
          "`[reply-abc-123] Здравствуйте! Можем помочь.`",
        { parse_mode: "Markdown" },
      );
    } catch (error) {
      console.error("Error in /chats command:", error);
      ctx.reply("❌ Ошибка при получении чат-сессий");
    }
  });

  // Details command
  bot.command("details", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) return;

    try {
      const args = ctx.message.text.split(" ");
      if (args.length < 2) {
        ctx.reply("❌ Использование: /details <ID>\nПример: /details EX-1234567890");
        return;
      }

      const requestId = args[1];

      let message = "";
      let badge = "";
      let statusName = "";

      if (requestId.startsWith("EX-")) {
        const request = await getExchangeRequestById(requestId);

        if (!request) {
          ctx.reply("❌ Заявка не найдена");
          return;
        }

        badge = getStatusBadge(request.status);
        statusName = getStatusName(request.status);
        message += `${badge} *${String(request.id)}*\n`;
        message += `📊 Статус: ${statusName}\n`;
        message += `📅 Создана: ${new Date(request.created_at).toLocaleString("ru-RU")}\n`;
        message += `🕐 Обновлена: ${new Date(request.updated_at).toLocaleString("ru-RU")}\n\n`;
        message += `💱 *Заявка на обмен*\n`;
        message += `💰 Токены: ${request.token_amount} TOKEN\n`;
        message += `💵 Фиат: ${request.fiat_amount} EUR\n`;
        message += `📊 Курс: ${request.rate}\n`;
        message += `💸 Комиссия: ${request.commission}\n`;
        message += `💼 Адрес: ${request.wallet_address}\n`;
        message += `📧 Email: ${request.email}\n`;
        if (request.comment) {
          message += `📝 Комментарий: ${request.comment}\n`;
        }
      } else if (requestId.startsWith("IR-")) {
        const request = await getInternalRequestById(requestId);

        if (!request) {
          ctx.reply("❌ Заявка не найдена");
          return;
        }

        badge = getStatusBadge(request.status);
        statusName = getStatusName(request.status);
        message += `${badge} *${String(request.id)}*\n`;
        message += `📊 Статус: ${statusName}\n`;
        message += `📅 Создана: ${new Date(request.created_at).toLocaleString("ru-RU")}\n`;
        message += `🕐 Обновлена: ${new Date(request.updated_at).toLocaleString("ru-RU")}\n\n`;
        message += `📝 *Внутренняя заявка*\n`;
        message += `👤 Запрашивающий: ${request.requester}\n`;
        message += `🏢 Отдел: ${request.department}\n`;
        message += `📋 Тип: ${request.request_type}\n`;
        message += `⭐ Приоритет: ${request.priority}\n`;
        message += `📝 Описание: ${request.description}\n`;
        if (request.email) {
          message += `📧 Email: ${request.email}\n`;
        }
      } else {
        ctx.reply("❌ Неверный формат ID");
        return;
      }

      // Add action buttons
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback("🔄 Обработать", `action_${requestId}_processing`),
          Markup.button.callback("✅ Завершить", `action_${requestId}_completed`),
        ],
        [
          Markup.button.callback("❌ Отклонить", `action_${requestId}_rejected`),
          Markup.button.callback("🚫 Отменить", `action_${requestId}_cancelled`),
        ],
      ]);

      ctx.reply(message, { parse_mode: "Markdown", ...keyboard });
    } catch (error) {
      console.error("Error in /details command:", error);
      ctx.reply("❌ Ошибка при получении деталей заявки");
    }
  });

  bot.command("refund", async (ctx) => {
    if (!(await checkAccess(ctx))) return;

    try {
      const args = ctx.message.text.trim().split(/\s+/);
      const input = args[1]?.trim();

      if (!input) {
        await ctx.reply(
          "❌ Использование: /refund <userId|WR_ID>\n\n" +
            "Пример по пользователю:\n" +
            "`/refund ee09fbea-b502-4280-b4e5-c52eb27a6839`\n\n" +
            "Пример по заявке:\n" +
            "`/refund 123e4567-e89b-12d3-a456-426614174000`",
          { parse_mode: "Markdown" },
        );
        return;
      }

      const normalizedInput = input.startsWith("WR-") ? input.slice(3) : input;

      if (!UUID_REGEX.test(normalizedInput)) {
        await ctx.reply(
          "❌ Неверный формат. Передайте UUID пользователя или UUID withdraw-заявки.",
        );
        return;
      }

      const request = await getWithdrawRequestById(normalizedInput);
      if (request) {
        const canRefund =
          request.status === "pending" ||
          request.status === "approved" ||
          request.status === "processing";
        const keyboard = canRefund
          ? Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  "↩️ Вернуть на баланс",
                  `withdraw_refund_${request.id}`,
                ),
              ],
            ])
          : undefined;

        await ctx.reply(formatWithdrawRequestDetails(request), {
          parse_mode: "MarkdownV2",
          ...(keyboard || {}),
        });
        return;
      }

      const requests = await listActiveWithdrawRequestsByUserId(normalizedInput);
      if (requests.length === 0) {
        await ctx.reply(
          `📭 Активных заявок на вывод для пользователя \`${normalizedInput}\` не найдено.`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      const totalByToken = requests.reduce<Record<string, bigint>>((acc, item) => {
        acc[item.tokenSymbol] = (acc[item.tokenSymbol] ?? BigInt(0)) + BigInt(item.amount);
        return acc;
      }, {});
      const totals = Object.entries(totalByToken)
        .map(([symbol, amount]) => `${formatTokenMinorAmount(amount.toString())} ${symbol}`)
        .join(", ");
      const list = requests
        .map((item, index) => `${index + 1}. ${formatWithdrawRequestLine(item)}`)
        .join("\n\n");

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "↩️ Вернуть все активные",
            `withdraw_refund_user_${normalizedInput}`,
          ),
        ],
      ]);

      await ctx.reply(
        `↩️ *Возврат активных выводов*\n\n` +
          `ID пользователя: \`${normalizedInput}\`\n` +
          `Заявок: ${requests.length}\n` +
          `Итого: ${totals}\n\n` +
          `${list}\n\n` +
          `Нажмите кнопку ниже, чтобы подтвердить возврат.`,
        { parse_mode: "Markdown", ...keyboard },
      );
    } catch (error) {
      console.error("[telegram-webhook] Error in /refund command:", error);
      await ctx.reply(
        "❌ Ошибка при подготовке возврата: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  });

  // Handle investigation status buttons
  bot.action(/^status_(.+)_(.+)$/, async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const match = ctx.match;
    const requestId = match[1];
    const newStage = match[2];

    // CRITICAL: Answer callback query IMMEDIATELY to remove loading indicator
    await ctx.answerCbQuery("⏳ Обновление статуса...").catch(() => {});

    try {
      console.log("[telegram-webhook] Investigation status update:", { requestId, newStage });

      // Update investigation status in database
      const stageMap: Record<string, string> = {
        submitted: "pending",
        checking: "processing",
        analyzing: "processing",
        investigating: "processing",
        recovering: "processing",
        completed: "completed",
      };

      const dbStatus = stageMap[newStage] || "pending";

      // Determine request type by ID prefix and update accordingly
      if (requestId.startsWith("EX-")) {
        // Exchange request
        await updateExchangeRequestStatus(
          requestId,
          dbStatus as "pending" | "processing" | "completed" | "rejected" | "cancelled",
        );
        await updateExchangeRequestStage(requestId, newStage);
      } else if (requestId.startsWith("IR-")) {
        // Internal request
        await updateInternalRequestStatus(
          requestId,
          dbStatus as "pending" | "processing" | "completed" | "rejected" | "cancelled",
        );
        await updateInternalRequestStage(requestId, newStage);
      } else {
        await ctx.reply("❌ Неверный формат ID заявки");
        return;
      }

      // Update via webhook (request not available in bot handler)
      await updateRequestStatus(requestId, dbStatus);

      // Confirm to user via message
      const stageLabels: Record<string, string> = {
        submitted: "✅ Заявка подана",
        checking: "📄 Проверка документов",
        analyzing: "🔍 Анализ транзакций",
        investigating: "🕵️ Расследование",
        recovering: "💰 Восстановление средств",
        completed: "✅ Завершено",
      };

      await ctx.reply(`✅ Статус обновлен: ${stageLabels[newStage] || newStage}`);
    } catch (error) {
      console.error("[telegram-webhook] Error updating investigation status:", error);
      console.error("[telegram-webhook] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestId,
        newStage,
      });
      await ctx.reply("❌ Ошибка при обновлении статуса").catch(() => {});
    }
  });

  // Handle action buttons
  bot.action(/^action_(.+)_(.+)$/, async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const match = ctx.match;
    const requestId = match[1];
    const newStatus = match[2];

    // CRITICAL: Answer callback query IMMEDIATELY to remove loading indicator
    await ctx.answerCbQuery("⏳ Обновление...").catch(() => {});

    try {
      // Update database
      if (requestId.startsWith("EX-")) {
        await updateExchangeRequestStatus(
          requestId,
          newStatus as "pending" | "processing" | "completed" | "rejected" | "cancelled",
        );
      } else if (requestId.startsWith("IR-")) {
        await updateInternalRequestStatus(
          requestId,
          newStatus as "pending" | "processing" | "completed" | "rejected" | "cancelled",
        );
      } else {
        await ctx.reply("❌ Неверный ID заявки");
        return;
      }

      // Update via webhook (request not available in bot handler)
      await updateRequestStatus(requestId, newStatus);

      // Respond to user via message
      const badge = getStatusBadge(newStatus);
      const statusName = getStatusName(newStatus);
      await ctx.reply(`✅ Статус обновлен: ${badge} ${statusName}`);
    } catch (error) {
      console.error("Error handling action:", error);
      await ctx.reply("❌ Ошибка при обновлении статуса").catch(() => {});
    }
  });

  // Simple storage for pending replies (in-memory, will be reset on restart)
  // Maps: chatId -> { walletAddress, sessionId, type }
  interface PendingReply {
    walletAddress: string;
    sessionId?: string;
    type: "support" | "chatbot";
  }
  const pendingReplies = new Map<number, PendingReply>();
  const typingTimeouts = new Map<string, NodeJS.Timeout>();
  // Track newsletter data for each manager
  interface PendingNewsletterData {
    photoFileId?: string;
    videoFileId?: string;
    documentFileId?: string;
    caption?: string;
    messageText?: string;
    awaitingMedia: boolean;
  }
  const pendingNewsletter = new Map<number, PendingNewsletterData>();
  // Track balance credit data for each admin
  interface PendingBalanceCredit {
    walletAddress?: string;
    userId?: string;
    amount?: string;
    reference?: string;
    step: "wallet" | "amount" | "reference" | "confirm";
  }
  const pendingBalanceCredit = new Map<number, PendingBalanceCredit>();

  // Track withdraw fee setting for each admin
  interface PendingWithdrawFee {
    requestId: string;
    step: "amount";
  }
  const pendingWithdrawFee = new Map<number, PendingWithdrawFee>();

  // ============================================
  // Support Messenger Callback Handlers
  // ============================================

  // Handle "Send Message" button (msg_WALLET_ADDRESS)
  bot.action(/^msg_(.+)$/, async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const walletAddress = ctx.match[1];
    const chatId = ctx.from.id;

    // CRITICAL: Answer callback query IMMEDIATELY to remove loading indicator
    await ctx.answerCbQuery().catch(() => {});

    try {
      console.log("[telegram-webhook] Support msg button clicked:", { walletAddress, chatId });

      // Validate wallet address format
      if (!isValidWalletAddress(walletAddress)) {
        console.warn("[telegram-webhook] Invalid wallet address format:", walletAddress);
        await ctx.reply(
          `⚠️ Support Messenger доступен только для пользователей с Ethereum кошельками.\n\n` +
            `Адрес \`${walletAddress}\` не является валидным Ethereum адресом.`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      // Store pending reply
      pendingReplies.set(chatId, {
        walletAddress,
        type: "support",
      });

      await ctx.reply(
        `💬 *Отправка сообщения пользователю*\n\n` +
          `Кошелек: \`${walletAddress}\`\n\n` +
          `Напишите сообщение, которое хотите отправить пользователю.\n` +
          `Для отмены используйте /cancel`,
        { parse_mode: "Markdown" },
      );
    } catch (error) {
      console.error("[telegram-webhook] Error in msg handler:", error);
      await ctx.reply("❌ Ошибка").catch(() => {});
    }
  });

  // Handle "Chat History" button (history_WALLET_ADDRESS)
  bot.action(/^history_(.+)$/, async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const walletAddress = ctx.match[1];

    // CRITICAL: Answer callback query IMMEDIATELY to remove loading indicator
    await ctx.answerCbQuery().catch(() => {});

    try {
      console.log("[telegram-webhook] Support history button clicked:", { walletAddress });

      // Validate wallet address format
      if (!isValidWalletAddress(walletAddress)) {
        console.warn("[telegram-webhook] Invalid wallet address format:", walletAddress);
        await ctx.reply(
          `⚠️ Support Messenger доступен только для пользователей с Ethereum кошельками.\n\n` +
            `Адрес \`${walletAddress}\` не является валидным Ethereum адресом.`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      // Fetch chat history from API
      const apiUrl = `${getAppUrl()}/api/support/get-chat-history?walletAddress=${walletAddress}&limit=10`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        await ctx.reply("❌ Ошибка при получении истории чата");
        return;
      }

      const data = await response.json();
      const messages = data.messages || [];

      if (messages.length === 0) {
        await ctx.reply("📭 История чата пуста");
        return;
      }

      // Format messages for the helper function
      const formattedMessages = (
        messages as Array<{
          type: string;
          text: string;
          adminUsername?: string;
          createdAt: string;
        }>
      ).map((msg) => ({
        type: msg.type,
        text: msg.text,
        admin_username: msg.adminUsername,
        created_at: msg.createdAt,
      }));

      // Use helper function to format history
      const historyText = formatChatHistoryForTelegram(formattedMessages);

      // Add reply button
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("💬 Ответить", `reply_${walletAddress}`)],
      ]);

      // Try with MarkdownV2 first, fallback to Markdown if it fails
      try {
        await ctx.reply(historyText, { parse_mode: "MarkdownV2", ...keyboard });
      } catch (markdownError) {
        console.warn("[telegram-webhook] MarkdownV2 failed, trying Markdown:", markdownError);
        // Fallback to regular Markdown (less strict)
        await ctx.reply(historyText, { parse_mode: "Markdown", ...keyboard });
      }
    } catch (error) {
      console.error("[telegram-webhook] Error in history handler:", error);
      try {
        await ctx.reply("❌ Ошибка при получении истории чата");
      } catch (replyError) {
        console.error("[telegram-webhook] Failed to send error message:", replyError);
      }
    }
  });

  // Handle "Reply" button (reply_WALLET_ADDRESS) - but NOT reply_to_chat_
  // Use negative lookahead to exclude reply_to_chat_ pattern
  bot.action(/^reply_(?!to_chat_)(.+)$/, async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const walletAddress = ctx.match[1];
    const chatId = ctx.from.id;

    // CRITICAL: Answer callback query IMMEDIATELY to remove loading indicator
    await ctx.answerCbQuery().catch(() => {});

    try {
      console.log("[telegram-webhook] Support reply button clicked:", { walletAddress, chatId });

      // Store pending reply
      pendingReplies.set(chatId, {
        walletAddress,
        type: "support",
      });

      await ctx.reply(
        `💬 *Ответить пользователю*\n\n` +
          `Кошелек: \`${walletAddress}\`\n\n` +
          `Напишите ваш ответ. Для отмены используйте /cancel`,
        { parse_mode: "Markdown" },
      );
    } catch (error) {
      console.error("[telegram-webhook] Error in reply handler:", error);
      await ctx.reply("❌ Ошибка").catch(() => {});
    }
  });

  // ============================================
  // Cancel Command
  // ============================================

  bot.command("cancel", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) return;

    const chatId = ctx.from.id;
    const pending = pendingReplies.get(chatId);
    const isNewsletterPending = pendingNewsletter.has(chatId);
    const isBalanceCreditPending = pendingBalanceCredit.has(chatId);
    const isWithdrawFeePending = pendingWithdrawFee.has(chatId);

    if (pending) {
      pendingReplies.delete(chatId);

      // Clear typing timeout if exists
      const timeoutKey = `${chatId}_${pending.walletAddress}`;
      if (typingTimeouts.has(timeoutKey)) {
        clearTimeout(typingTimeouts.get(timeoutKey)!);
        typingTimeouts.delete(timeoutKey);
      }

      ctx.reply("❌ Отправка сообщения отменена");
    } else if (isNewsletterPending) {
      pendingNewsletter.delete(chatId);
      ctx.reply("❌ Отправка рассылки отменена");
    } else if (isBalanceCreditPending) {
      pendingBalanceCredit.delete(chatId);
      ctx.reply("❌ Начисление баланса отменено");
    } else if (isWithdrawFeePending) {
      pendingWithdrawFee.delete(chatId);
      ctx.reply("❌ Установка комиссии отменена");
    } else {
      ctx.reply(
        "Нет активной отправки сообщения, рассылки, начисления баланса или установки комиссии",
      );
    }
  });

  // Chatbot callback handler - handle reply button click
  bot.action(/^reply_to_chat_(.+)$/, async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const sessionId = ctx.match[1];
    const chatId = ctx.chat?.id || ctx.from?.id;

    // CRITICAL: Answer callback query IMMEDIATELY to remove loading indicator
    await ctx.answerCbQuery().catch(() => {});

    try {
      console.log("[telegram-webhook] Reply button clicked for session:", sessionId);

      if (chatId) {
        // Store session ID for this chat (chatbot type)
        pendingReplies.set(chatId, {
          walletAddress: "", // Not needed for chatbot
          sessionId,
          type: "chatbot",
        });
      }

      // Send a message asking for the reply text
      await ctx.reply(
        `📝 Введите ваш ответ для пользователя:\n\n` +
          `Просто напишите сообщение, и оно будет автоматически отправлено пользователю.`,
      );
    } catch (error) {
      console.error("[telegram-webhook] Error handling reply button:", error);
      await ctx.reply("❌ Ошибка").catch(() => {});
    }
  });

  // Balance credit command for admins - credit balance to user
  bot.command("credit", async (ctx) => {
    console.log("[telegram-webhook] /credit command received from user:", ctx.from.id);

    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      console.log("[telegram-webhook] /credit command: access denied for user:", ctx.from.id);
      return;
    }

    try {
      const chatId = ctx.from.id;
      console.log("[telegram-webhook] /credit command: initializing for chat:", chatId);

      // Mark that this chat is waiting for balance credit data
      pendingBalanceCredit.set(chatId, {
        step: "wallet",
      });

      await ctx.reply(
        `💰 *Начисление баланса пользователю*\n\n` +
          `Введите адрес кошелька пользователя (0x...) или ID пользователя (UUID)\n\n` +
          `Примеры:\n` +
          `• Адрес кошелька: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\n` +
          `• ID пользователя: 123e4567-e89b-12d3-a456-426614174000\n\n` +
          `Для отмены используйте /cancel`,
        { parse_mode: "Markdown" },
      );

      console.log("[telegram-webhook] /credit command: reply sent successfully");
    } catch (error) {
      console.error("Error in credit command:", error);
      await ctx.reply("❌ Ошибка при инициализации начисления баланса").catch(() => {});
    }
  });

  // Unified text handler - listen for admin replies and newsletter
  bot.on("text", async (ctx) => {
    try {
      // Validate message structure
      if (!ctx.message || !ctx.message.text) {
        console.warn("[telegram-webhook] Invalid message structure:", ctx.message);
        return;
      }

      const messageText = ctx.message.text;

      // Skip if it's a command (commands are handled separately)
      if (messageText.startsWith("/")) {
        return;
      }

      // 🔒 Authorization check - must be after command check to allow /myid for everyone
      if (!(await checkAccess(ctx))) return;

      const chatId = ctx.from.id;
      const managerChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
      const isManager = managerChatId && chatId.toString() === managerChatId;

      // Check if we're awaiting a reply from the button click
      const pending = pendingReplies.get(chatId);

      if (pending) {
        const adminResponse = messageText;
        const adminUsername = ctx.from.first_name || ctx.from.username || "Admin";

        // Handle support messenger reply
        if (pending.type === "support") {
          console.log("[telegram-webhook] Support message detected:", {
            walletAddress: pending.walletAddress,
            text: adminResponse,
            adminId: ctx.from.id,
          });

          // Clear the pending flag immediately
          pendingReplies.delete(chatId);

          // Clear typing timeout if exists
          const timeoutKey = `${chatId}_${pending.walletAddress}`;
          if (typingTimeouts.has(timeoutKey)) {
            clearTimeout(typingTimeouts.get(timeoutKey)!);
            typingTimeouts.delete(timeoutKey);
          }

          try {
            // Set typing indicator
            console.log(
              "[telegram-webhook] Setting typing indicator for wallet:",
              pending.walletAddress,
            );

            await query(
              `INSERT INTO typing_indicators (user_wallet_address, admin_id, admin_username, is_typing, started_at, expires_at)
               VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 seconds')
               ON CONFLICT (user_wallet_address, admin_id)
               DO UPDATE SET is_typing = $4, started_at = CURRENT_TIMESTAMP, expires_at = CURRENT_TIMESTAMP + INTERVAL '30 seconds', admin_username = $3`,
              [pending.walletAddress, ctx.from.id, adminUsername, true],
            ).catch((err) => {
              console.error("[telegram-webhook] Failed to set typing:", err);
              // Don't fail if typing indicator fails
            });

            // Wait a bit to simulate typing
            await new Promise((resolve) => setTimeout(resolve, 1500));

            console.log("[telegram-webhook] Sending support message:", {
              walletAddress: pending.walletAddress,
              text: adminResponse.substring(0, 50) + "...",
              adminId: ctx.from.id,
              adminUsername,
              sessionId: pending.sessionId,
            });

            // Sanitize message text
            const sanitizedText = sanitizeMessageText(adminResponse, 2000);
            if (sanitizedText.length === 0) {
              await ctx.reply("❌ Сообщение пустое после фильтрации").catch(() => {});
              return;
            }

            // Get or verify session
            let session;
            if (pending.sessionId) {
              const result = await query(
                `SELECT id FROM chatbot_sessions WHERE id = $1 AND user_wallet_address = $2`,
                [pending.sessionId, pending.walletAddress],
              );
              if (result.rows.length === 0) {
                await ctx.reply("❌ Сессия не найдена").catch(() => {});
                return;
              }
              session = { id: pending.sessionId };
            } else {
              session = await getLatestSessionByWallet(pending.walletAddress);
              if (!session) {
                await ctx.reply("❌ Нет активной сессии для этого кошелька").catch(() => {});
                return;
              }
            }

            // Create admin message directly
            const message = await createSupportMessage({
              sessionId: session.id,
              walletAddress: pending.walletAddress,
              type: "admin",
              text: sanitizedText,
              adminId: ctx.from.id,
              adminUsername,
            });

            // Update session metadata
            await query(
              `UPDATE chatbot_sessions
               SET last_admin_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
               WHERE id = $1`,
              [session.id],
            );

            // Remove typing indicator
            await query(
              `DELETE FROM typing_indicators WHERE user_wallet_address = $1 AND admin_id = $2`,
              [pending.walletAddress, ctx.from.id],
            );

            console.log("[telegram-webhook] Support message saved:", {
              messageId: message.id,
              sessionId: session.id,
            });

            await ctx.reply("✅ Сообщение отправлено пользователю").catch((err) => {
              console.error("[telegram-webhook] Failed to send confirmation:", err);
            });
          } catch (error) {
            console.error("[telegram-webhook] Error sending support message:", {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            });
            try {
              await ctx.reply(
                "❌ Ошибка при отправке сообщения: " +
                  (error instanceof Error ? error.message : String(error)),
              );
            } catch (replyError) {
              console.error("[telegram-webhook] Failed to send error message:", replyError);
            }
          }
          return;
        }

        // Handle chatbot reply
        if (pending.type === "chatbot" && pending.sessionId) {
          const sessionId = pending.sessionId;

          console.log("[telegram-webhook] Chatbot reply detected via button:", {
            sessionId,
            text: adminResponse.substring(0, 50) + "...",
            adminId: ctx.from.id,
          });

          // Clear the pending flag immediately
          pendingReplies.delete(chatId);

          try {
            // Verify session exists
            const session = await getChatbotSessionById(sessionId);
            if (!session) {
              console.log("[telegram-webhook] Session not found:", sessionId);
              await ctx.reply("❌ Сессия не найдена").catch(() => {});
              return;
            }

            console.log("[telegram-webhook] Session found:", session);

            // Save admin message directly to database
            const adminMessage = await createChatbotMessage({
              sessionId: sessionId,
              type: "admin",
              text: adminResponse,
              isAdminResponse: true,
            });

            console.log("[telegram-webhook] Admin response saved:", {
              sessionId: sessionId,
              adminId: ctx.from.id,
              messageId: adminMessage.id,
              timestamp: new Date().toISOString(),
            });

            await ctx.reply("✅ Ответ отправлен пользователю").catch((err) => {
              console.error("[telegram-webhook] Failed to send confirmation:", err);
            });
          } catch (error) {
            console.error("[telegram-webhook] Error sending admin response:", {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            });
            try {
              await ctx.reply(
                "❌ Ошибка при отправке ответа: " +
                  (error instanceof Error ? error.message : String(error)),
              );
            } catch (replyError) {
              console.error("[telegram-webhook] Failed to send error message:", replyError);
            }
          }
          return;
        }
      }

      // Check if this is an admin reply to chatbot (legacy format)
      // Format: [reply-SESSION_ID] message text
      const match = messageText.match(/^\[reply-([^\]]+)\]\s*(.+)/);

      if (match && ctx.chat.type === "private") {
        const sessionId = match[1];
        const adminResponse = match[2];

        console.log("[telegram-webhook] Admin reply detected (legacy format):", {
          sessionId,
          text: adminResponse.substring(0, 50) + "...",
          adminId: ctx.from.id,
        });

        try {
          // Verify session exists
          const session = await getChatbotSessionById(sessionId);
          if (!session) {
            console.log("[telegram-webhook] Session not found (legacy):", sessionId);
            await ctx.reply("❌ Сессия не найдена").catch(() => {});
            return;
          }

          console.log("[telegram-webhook] Session found (legacy):", session);

          // Save admin message directly to database
          const adminMessage = await createChatbotMessage({
            sessionId: sessionId,
            type: "admin",
            text: adminResponse,
            isAdminResponse: true,
          });

          console.log("[telegram-webhook] Admin response saved (legacy):", {
            sessionId: sessionId,
            adminId: ctx.from.id,
            messageId: adminMessage.id,
            timestamp: new Date().toISOString(),
          });

          await ctx.reply("✅ Ответ отправлен пользователю").catch((err) => {
            console.error("[telegram-webhook] Failed to send confirmation:", err);
          });
        } catch (error) {
          console.error("[telegram-webhook] Error sending admin response (legacy):", error);
          try {
            await ctx.reply(
              "❌ Ошибка при отправке ответа: " +
                (error instanceof Error ? error.message : String(error)),
            );
          } catch (replyError) {
            console.error("[telegram-webhook] Failed to send error message:", replyError);
          }
        }
        return;
      }

      // Withdraw fee handler
      const withdrawFeeData = pendingWithdrawFee.get(chatId);
      if (withdrawFeeData) {
        try {
          const messageLower = messageText.trim().toLowerCase();

          // Handle cancellation
          if (messageLower === "отмена" || messageLower === "cancel") {
            pendingWithdrawFee.delete(chatId);
            await ctx.reply("❌ Установка комиссии отменена");
            return;
          }

          // Handle removal of fee
          if (messageLower === "0" || messageLower === "нет" || messageLower === "no") {
            const appUrl = getAppUrl();
            const adminSecret = process.env.INTERNAL_BALANCE_SIGNING_SECRET;

            if (!adminSecret) {
              await ctx.reply(
                "❌ Ошибка конфигурации: INTERNAL_BALANCE_SIGNING_SECRET не установлен",
              );
              pendingWithdrawFee.delete(chatId);
              return;
            }

            const response = await fetch(
              `${appUrl}/api/internal-balance/withdraw/${withdrawFeeData.requestId}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "x-internal-admin-token": adminSecret,
                },
                body: JSON.stringify({
                  feeAmount: null,
                }),
              },
            );

            const data = await response.json();

            if (!response.ok) {
              const errorMessage = data.error || "Неизвестная ошибка";
              await ctx.reply(`❌ Ошибка при удалении комиссии:\n\n\`${errorMessage}\``, {
                parse_mode: "Markdown",
              });
              pendingWithdrawFee.delete(chatId);
              return;
            }

            await ctx.reply(`✅ Комиссия удалена для заявки WR-${withdrawFeeData.requestId}`);
            pendingWithdrawFee.delete(chatId);
            return;
          }

          // Parse fee amount (should be in token units with decimals)
          const feeAmount = messageText.trim();

          // Validate that it's a valid number (can be a big integer string)
          if (!/^\d+$/.test(feeAmount)) {
            await ctx.reply(
              "❌ Неверный формат суммы комиссии.\n\n" +
                "Введите сумму в токенах (только цифры, например: 1000000000000000000 для 1 токена с 18 десятичными знаками)\n\n" +
                'Или отправьте "0" или "нет" чтобы убрать комиссию.\n\n' +
                'Отправьте "отмена" чтобы отменить.',
            );
            return;
          }

          const appUrl = getAppUrl();
          const adminSecret = process.env.INTERNAL_BALANCE_SIGNING_SECRET;

          if (!adminSecret) {
            await ctx.reply(
              "❌ Ошибка конфигурации: INTERNAL_BALANCE_SIGNING_SECRET не установлен",
            );
            pendingWithdrawFee.delete(chatId);
            return;
          }

          const response = await fetch(
            `${appUrl}/api/internal-balance/withdraw/${withdrawFeeData.requestId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "x-internal-admin-token": adminSecret,
              },
              body: JSON.stringify({
                feeAmount: feeAmount,
              }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            const errorMessage = data.error || "Неизвестная ошибка";
            await ctx.reply(`❌ Ошибка при установке комиссии:\n\n\`${errorMessage}\``, {
              parse_mode: "Markdown",
            });
            pendingWithdrawFee.delete(chatId);
            return;
          }

          await ctx.reply(
            `✅ Комиссия установлена: ${feeAmount} для заявки WR-${withdrawFeeData.requestId}`,
          );
          pendingWithdrawFee.delete(chatId);
        } catch (error) {
          console.error("[telegram-webhook] Error in withdraw fee handler:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          await ctx
            .reply(`❌ Ошибка при установке комиссии:\n\n\`${errorMessage}\``, {
              parse_mode: "Markdown",
            })
            .catch(() => {});
          pendingWithdrawFee.delete(chatId);
        }
        return;
      }

      // Balance credit handler - must be checked before default handler
      const balanceCreditData = pendingBalanceCredit.get(chatId);
      if (balanceCreditData) {
        try {
          console.log("[telegram-webhook] Balance credit handler triggered:", {
            chatId,
            step: balanceCreditData.step,
            messageText: messageText.substring(0, 50),
          });

          // Handle cancellation
          const messageLower = messageText.trim().toLowerCase();
          if (messageLower === "отмена" || messageLower === "cancel") {
            pendingBalanceCredit.delete(chatId);
            await ctx.reply("❌ Начисление баланса отменено");
            return;
          }

          if (balanceCreditData.step === "wallet") {
            const input = messageText.trim();

            // Check if it's a wallet address
            if (isValidWalletAddress(input)) {
              balanceCreditData.walletAddress = input.toLowerCase();
              balanceCreditData.userId = undefined;
              balanceCreditData.step = "amount";

              await ctx.reply(
                `✅ Адрес кошелька: \`${input}\`\n\n` +
                  `Введите сумму для начисления (например: 100.5)\n\n` +
                  `Для отмены используйте /cancel`,
                { parse_mode: "Markdown" },
              );
              return;
            }

            // Check if it's a UUID (user ID)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(input)) {
              try {
                const user = await getUserById(input);
                if (!user) {
                  await ctx.reply(
                    "❌ Пользователь с таким ID не найден.\n\n" +
                      "Проверьте правильность ID и попробуйте снова.\n\n" +
                      "Для отмены используйте /cancel",
                  );
                  return;
                }

                balanceCreditData.userId = input;
                balanceCreditData.walletAddress = user.walletAddress?.toLowerCase() || undefined;
                balanceCreditData.step = "amount";

                const userInfo = user.email || user.name || "Пользователь";
                await ctx.reply(
                  `✅ Пользователь найден:\n` +
                    `• ID: \`${input}\`\n` +
                    `• Email/Имя: ${userInfo}\n` +
                    (user.walletAddress ? `• Кошелек: \`${user.walletAddress}\`\n` : "") +
                    `\nВведите сумму для начисления (например: 100.5)\n\n` +
                    `Для отмены используйте /cancel`,
                  { parse_mode: "Markdown" },
                );
                return;
              } catch (error) {
                console.error("[telegram-webhook] Error fetching user by ID:", error);
                await ctx.reply(
                  "❌ Ошибка при поиске пользователя.\n\n" +
                    "Попробуйте снова или используйте адрес кошелька.\n\n" +
                    "Для отмены используйте /cancel",
                );
                return;
              }
            }

            // Neither wallet address nor UUID
            await ctx.reply(
              "❌ Неверный формат.\n\n" +
                "Введите корректный Ethereum адрес (начинается с 0x...) или ID пользователя (UUID)\n\n" +
                "Примеры:\n" +
                "• Адрес: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\n" +
                "• ID: 123e4567-e89b-12d3-a456-426614174000\n\n" +
                "Для отмены используйте /cancel",
            );
            return;
          }

          if (balanceCreditData.step === "amount") {
            const amountInput = messageText.trim();
            const amountNum = parseFloat(amountInput);

            if (isNaN(amountNum) || amountNum <= 0) {
              await ctx.reply(
                "❌ Неверная сумма.\n\n" +
                  "Введите положительное число (например: 100.5)\n\n" +
                  "Для отмены используйте /cancel",
              );
              return;
            }

            balanceCreditData.amount = amountInput;
            balanceCreditData.step = "reference";

            await ctx.reply(
              `✅ Сумма: ${amountInput}\n\n` +
                `Введите описание/причину начисления (или отправьте "-" для пропуска)\n\n` +
                `Для отмены используйте /cancel`,
            );
            return;
          }

          if (balanceCreditData.step === "reference") {
            const referenceInput = messageText.trim();
            balanceCreditData.reference = referenceInput === "-" ? undefined : referenceInput;
            balanceCreditData.step = "confirm";

            // Show confirmation
            const keyboard = Markup.inlineKeyboard([
              [
                Markup.button.callback("✅ Подтвердить", "balance_credit_confirm"),
                Markup.button.callback("❌ Отменить", "balance_credit_cancel"),
              ],
            ]);

            const identifierText = balanceCreditData.userId
              ? `👤 ID пользователя: \`${balanceCreditData.userId}\``
              : `💼 Кошелек: \`${balanceCreditData.walletAddress}\``;

            await ctx.reply(
              `📋 *Подтверждение начисления баланса*\n\n` +
                `${identifierText}\n` +
                `💰 Сумма: ${balanceCreditData.amount}\n` +
                `📝 Описание: ${balanceCreditData.reference || "—"}\n\n` +
                `Подтвердить начисление?`,
              { parse_mode: "Markdown", ...keyboard },
            );
            return;
          }

          // If step is "confirm" or unknown, ignore the message (user should use buttons)
          if (balanceCreditData.step === "confirm") {
            await ctx.reply(
              "⏳ Ожидается подтверждение через кнопки выше.\n\n" +
                "Используйте кнопки ✅ Подтвердить или ❌ Отменить для продолжения.",
            );
            return;
          }

          // Unknown step - reset
          console.warn("[telegram-webhook] Unknown balance credit step:", balanceCreditData.step);
          await ctx.reply("❌ Неизвестное состояние. Начните заново с /credit");
          pendingBalanceCredit.delete(chatId);
          return;
        } catch (error) {
          console.error("[telegram-webhook] Error in balance credit handler:", error);
          await ctx
            .reply("❌ Ошибка при обработке данных. Попробуйте снова с /credit")
            .catch(() => {});
          pendingBalanceCredit.delete(chatId);
          return;
        }
      }

      // Newsletter handler - only for manager and only if waiting for newsletter
      const newsletterData = pendingNewsletter.get(chatId);
      if (isManager && newsletterData && newsletterData.awaitingMedia) {
        try {
          // Update newsletter data with text message
          pendingNewsletter.set(chatId, {
            ...newsletterData,
            messageText: messageText,
            awaitingMedia: false,
          });

          // Ask for confirmation
          const keyboard = Markup.inlineKeyboard([
            [
              Markup.button.callback("✅ Отправить", "newsletter_confirm"),
              Markup.button.callback("❌ Отменить", "newsletter_cancel"),
            ],
          ]);

          await ctx.reply(
            `📝 *Текстовое сообщение получено!*\n\n` +
              `Текст: ${messageText.substring(0, 200)}${messageText.length > 200 ? "..." : ""}\n\n` +
              `Отправить рассылку всем подписчикам?`,
            { parse_mode: "Markdown", ...keyboard },
          );
          return;
        } catch (error) {
          console.error("Error in newsletter text handler:", error);
          await ctx.reply("❌ Ошибка при обработке текста").catch(() => {});
          return;
        }
      }

      // Default text handler
      await ctx.reply(
        "Используйте команды:\n" +
          "/list - показать все заявки\n" +
          "/exchange - показать заявки на обмен\n" +
          "/internal - показать внутренние заявки\n" +
          "/details <ID> - детали заявки\n" +
          "/chats - активные чат-сессии\n" +
          "/refund <userId|WR_ID> - вернуть вывод на баланс\n\n" +
          "Для получения подробной справки используйте /help",
      );
    } catch (error) {
      console.error("[telegram-webhook] Unexpected error in text handler:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      try {
        await ctx.reply("❌ Произошла ошибка при обработке сообщения");
      } catch (replyError) {
        console.error("[telegram-webhook] Failed to send error message:", replyError);
      }
    }
  });

  // Newsletter subscription commands
  bot.command("subscribe", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) return;

    try {
      const chatId = ctx.chat.id.toString();
      const username = ctx.from.first_name || "User";

      // Check if already subscribed
      const existing = await query("SELECT * FROM newsletter_subscribers WHERE chat_id = $1", [
        chatId,
      ]);

      if (existing.rows.length > 0) {
        // Update to active
        await query("UPDATE newsletter_subscribers SET is_active = true WHERE chat_id = $1", [
          chatId,
        ]);
        ctx.reply(
          "✅ Вы уже подписаны на рассылку!\n\n" +
            "Вы будете получать новости и обновления о EuroCoin.",
        );
      } else {
        // Add new subscriber
        await query("INSERT INTO newsletter_subscribers (chat_id, language) VALUES ($1, 'ru')", [
          chatId,
        ]);
        ctx.reply(
          `🎉 Спасибо за подписку, ${username}!\n\n` +
            `Вы теперь будете получать рассылку новостей и обновлений о EuroCoin.\n\n` +
            `Для отписки используйте /unsubscribe`,
        );
      }
    } catch (error) {
      console.error("Error in subscribe command:", error);
      ctx.reply("❌ Ошибка при подписке. Попробуйте позже.");
    }
  });

  bot.command("unsubscribe", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) return;

    try {
      const chatId = ctx.chat.id.toString();

      await query("UPDATE newsletter_subscribers SET is_active = false WHERE chat_id = $1", [
        chatId,
      ]);

      ctx.reply(
        "👋 Вы отписались от рассылки.\n\n" +
          "Мы будем скучать! Подпишитесь снова командой /subscribe",
      );
    } catch (error) {
      console.error("Error in unsubscribe command:", error);
      ctx.reply("❌ Ошибка при отписке. Попробуйте позже.");
    }
  });

  // Newsletter command for admins - send newsletter to all email subscribers
  bot.command("newsletter", async (ctx) => {
    console.log("[newsletter] Command received from user:", ctx.from?.id, "chat:", ctx.chat?.id);

    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      console.log("[newsletter] Access denied by checkAccess");
      return;
    }

    try {
      const managerChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
      const chatId = ctx.chat.id.toString();

      console.log("[newsletter] Manager chat ID:", managerChatId, "Current chat ID:", chatId);

      // Check if user is admin (additional check for manager-specific command)
      if (chatId !== managerChatId) {
        console.log("[newsletter] Access denied: chat ID mismatch");
        await ctx.reply("❌ У вас нет доступа к этой команде");
        return;
      }

      // Get count of verified subscribers
      console.log("[newsletter] Querying database for subscribers...");
      const subscribers = await query(
        "SELECT COUNT(*) as count FROM newsletter_subscribers WHERE verified = true AND is_active = true",
      );

      const count = subscribers.rows[0]?.count || 0;
      console.log("[newsletter] Found subscribers:", count);

      // Mark that this chat is waiting for newsletter content
      pendingNewsletter.set(ctx.from.id, {
        awaitingMedia: true,
      });

      await ctx.reply(
        `📧 *Рассылка на email подписчикам*\n\n` +
          `Активных подписчиков с подтвержденным email: ${count}\n\n` +
          `📝 Отправьте контент для рассылки:\n\n` +
          `• 📸 *Изображение с подписью* - отправьте фото с текстом\n` +
          `• 📄 *Только текст* - отправьте текстовое сообщение\n\n` +
          `Для отмены используйте /cancel\n\n` +
          `_Совет: Вы можете использовать Markdown форматирование и ссылки [текст](https://example.com)_`,
        { parse_mode: "Markdown" },
      );

      console.log("[newsletter] Successfully sent instructions to user");
    } catch (error) {
      console.error("[newsletter] Error in newsletter command:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await ctx
        .reply(`❌ Ошибка при получении информации о рассылке: ${errorMessage}`)
        .catch((err) => {
          console.error("[newsletter] Failed to send error message:", err);
        });
    }
  });

  // Handle photo for newsletter
  bot.on("photo", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) return;

    try {
      const chatId = ctx.from.id;
      const newsletterData = pendingNewsletter.get(chatId);

      if (!newsletterData || !newsletterData.awaitingMedia) {
        return; // Not waiting for newsletter content
      }

      // Get the largest photo (best quality)
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const caption = ctx.message.caption || "";

      // Update newsletter data
      pendingNewsletter.set(chatId, {
        ...newsletterData,
        photoFileId: photo.file_id,
        caption: caption,
        awaitingMedia: false,
      });

      // Ask for confirmation
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Отправить", "newsletter_confirm"),
          Markup.button.callback("❌ Отменить", "newsletter_cancel"),
        ],
      ]);

      await ctx.reply(
        `📸 *Изображение получено!*\n\n` +
          (caption ? `Текст: ${caption}\n\n` : "") +
          `Отправить рассылку всем подписчикам?`,
        { parse_mode: "Markdown", ...keyboard },
      );
    } catch (error) {
      console.error("Error handling photo for newsletter:", error);
      await ctx.reply("❌ Ошибка при обработке изображения").catch(() => {});
    }
  });

  // Handle video for newsletter
  bot.on("video", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) return;

    try {
      const chatId = ctx.from.id;
      const newsletterData = pendingNewsletter.get(chatId);

      if (!newsletterData || !newsletterData.awaitingMedia) {
        return; // Not waiting for newsletter content
      }

      const video = ctx.message.video;
      const caption = ctx.message.caption || "";

      // Update newsletter data
      pendingNewsletter.set(chatId, {
        ...newsletterData,
        videoFileId: video.file_id,
        caption: caption,
        awaitingMedia: false,
      });

      // Ask for confirmation
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Отправить", "newsletter_confirm"),
          Markup.button.callback("❌ Отменить", "newsletter_cancel"),
        ],
      ]);

      await ctx.reply(
        `🎥 *Видео получено!*\n\n` +
          (caption ? `Текст: ${caption}\n\n` : "") +
          `Отправить рассылку всем подписчикам?`,
        { parse_mode: "Markdown", ...keyboard },
      );
    } catch (error) {
      console.error("Error handling video for newsletter:", error);
      await ctx.reply("❌ Ошибка при обработке видео").catch(() => {});
    }
  });

  // Handle document for newsletter
  bot.on("document", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) return;

    try {
      const chatId = ctx.from.id;
      const newsletterData = pendingNewsletter.get(chatId);

      if (!newsletterData || !newsletterData.awaitingMedia) {
        return; // Not waiting for newsletter content
      }

      const document = ctx.message.document;
      const caption = ctx.message.caption || "";

      // Update newsletter data
      pendingNewsletter.set(chatId, {
        ...newsletterData,
        documentFileId: document.file_id,
        caption: caption,
        awaitingMedia: false,
      });

      // Ask for confirmation
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Отправить", "newsletter_confirm"),
          Markup.button.callback("❌ Отменить", "newsletter_cancel"),
        ],
      ]);

      await ctx.reply(
        `📎 *Документ получен!*\n\n` +
          `Файл: ${document.file_name || "Без названия"}\n` +
          (caption ? `Текст: ${caption}\n\n` : "") +
          `Отправить рассылку всем подписчикам?`,
        { parse_mode: "Markdown", ...keyboard },
      );
    } catch (error) {
      console.error("Error handling document for newsletter:", error);
      await ctx.reply("❌ Ошибка при обработке документа").catch(() => {});
    }
  });

  // Handle confirmation buttons for newsletter
  bot.action("newsletter_confirm", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    await ctx.answerCbQuery().catch(() => {});

    try {
      const chatId = ctx.from.id;
      const newsletterData = pendingNewsletter.get(chatId);

      if (!newsletterData) {
        await ctx.reply("❌ Данные рассылки не найдены");
        return;
      }

      // Get count of active email subscribers
      const subscribers = await query(
        "SELECT COUNT(*) as count FROM newsletter_subscribers WHERE verified = true AND is_active = true AND email IS NOT NULL",
      );

      const count = subscribers.rows[0]?.count || 0;

      if (count === 0) {
        await ctx.reply("❌ Нет активных подписчиков с подтвержденным email");
        pendingNewsletter.delete(chatId);
        return;
      }

      await ctx.reply(`📤 Отправка рассылки на email ${count} подписчикам...`);

      // Send newsletter via email API
      const response = await fetch(`${getAppUrl()}/api/newsletter/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newsletterData.caption || newsletterData.messageText || "",
          photoFileId: newsletterData.photoFileId,
          authToken: process.env.NEWSLETTER_AUTH_TOKEN,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await ctx.reply(
          `✅ Рассылка отправлена!\n\n` + `Отправлено: ${data.sent}\n` + `Ошибок: ${data.failed}`,
        );
      } else {
        await ctx.reply(`❌ Ошибка при отправке: ${data.error}`);
      }

      // Clear newsletter data
      pendingNewsletter.delete(chatId);
    } catch (error) {
      console.error("Error confirming newsletter:", error);
      await ctx.reply("❌ Ошибка при отправке рассылки").catch(() => {});
    }
  });

  // Handle cancel button for newsletter
  bot.action("newsletter_cancel", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    await ctx.answerCbQuery().catch(() => {});

    const chatId = ctx.from.id;
    pendingNewsletter.delete(chatId);

    await ctx.reply("❌ Рассылка отменена");
  });

  // Handle confirmation button for balance credit
  bot.action("balance_credit_confirm", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    await ctx.answerCbQuery("⏳ Начисление баланса...").catch(() => {});

    try {
      const chatId = ctx.from.id;
      const balanceCreditData = pendingBalanceCredit.get(chatId);

      if (
        !balanceCreditData ||
        (!balanceCreditData.walletAddress && !balanceCreditData.userId) ||
        !balanceCreditData.amount
      ) {
        await ctx.reply("❌ Данные начисления не найдены. Начните заново с /credit");
        pendingBalanceCredit.delete(chatId);
        return;
      }

      // Call API to credit balance
      const appUrl = getAppUrl();
      const adminSecret = process.env.INTERNAL_BALANCE_SIGNING_SECRET;

      if (!adminSecret) {
        await ctx.reply("❌ Ошибка конфигурации: INTERNAL_BALANCE_SIGNING_SECRET не установлен");
        pendingBalanceCredit.delete(chatId);
        return;
      }

      // Prepare request body - prioritize userId if available
      const requestBody: {
        userId?: string;
        walletAddress?: string;
        amount: string;
        reference?: string;
        createdBy: string;
      } = {
        amount: balanceCreditData.amount,
        reference: balanceCreditData.reference,
        createdBy: ctx.from.first_name || ctx.from.username || "telegram-admin",
      };

      if (balanceCreditData.userId) {
        requestBody.userId = balanceCreditData.userId;
        if (balanceCreditData.walletAddress) {
          requestBody.walletAddress = balanceCreditData.walletAddress;
        }
      } else if (balanceCreditData.walletAddress) {
        requestBody.walletAddress = balanceCreditData.walletAddress;
      }

      const response = await fetch(`${appUrl}/api/internal-balance/credit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-admin-token": adminSecret,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Неизвестная ошибка";
        await ctx.reply(
          `❌ Ошибка при начислении баланса:\n\n` +
            `\`${errorMessage}\`\n\n` +
            `Проверьте, что пользователь зарегистрирован в системе.`,
          { parse_mode: "Markdown" },
        );
        pendingBalanceCredit.delete(chatId);
        return;
      }

      // Success
      const balance = data.balance?.balance || "0";
      const tokenSymbol = data.tokenSymbol || "EURC";
      const decimals = data.decimals || 18;

      // Format balance for display
      const balanceFormatted = (parseFloat(balance) / Math.pow(10, decimals)).toFixed(2);

      const identifierText = balanceCreditData.userId
        ? `👤 ID пользователя: \`${balanceCreditData.userId}\``
        : `💼 Кошелек: \`${balanceCreditData.walletAddress}\``;

      await ctx.reply(
        `✅ *Баланс успешно начислен!*\n\n` +
          `${identifierText}\n` +
          `💰 Начислено: ${balanceCreditData.amount} ${tokenSymbol}\n` +
          `📊 Новый баланс: ${balanceFormatted} ${tokenSymbol}\n` +
          (balanceCreditData.reference ? `📝 Описание: ${balanceCreditData.reference}\n` : ""),
        { parse_mode: "Markdown" },
      );

      pendingBalanceCredit.delete(chatId);
    } catch (error) {
      console.error("Error confirming balance credit:", error);
      await ctx.reply("❌ Ошибка при начислении баланса").catch(() => {});
      const chatId = ctx.from.id;
      pendingBalanceCredit.delete(chatId);
    }
  });

  // Handle cancel button for balance credit
  bot.action("balance_credit_cancel", async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    await ctx.answerCbQuery().catch(() => {});

    const chatId = ctx.from.id;
    pendingBalanceCredit.delete(chatId);

    await ctx.reply("❌ Начисление баланса отменено");
  });

  // ============================================
  // Withdrawal Request Actions
  // ============================================

  // Handle withdraw approve button
  bot.action(/^withdraw_approve_(.+)$/, async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const requestId = ctx.match[1];
    await ctx.answerCbQuery("⏳ Одобрение заявки...").catch(() => {});

    try {
      const appUrl = getAppUrl();
      const adminSecret = process.env.INTERNAL_BALANCE_SIGNING_SECRET;

      if (!adminSecret) {
        await ctx.reply("❌ Ошибка конфигурации: INTERNAL_BALANCE_SIGNING_SECRET не установлен");
        return;
      }

      const response = await fetch(`${appUrl}/api/internal-balance/withdraw/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-internal-admin-token": adminSecret,
        },
        body: JSON.stringify({
          status: "approved",
          reviewerId: null, // reviewerId должен быть UUID пользователя из системы, а не Telegram ID
          notes: `Одобрено через Telegram бота пользователем ${ctx.from.first_name || ctx.from.username || "admin"} (Telegram ID: ${ctx.from.id})`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Неизвестная ошибка";
        await ctx.reply(`❌ Ошибка при одобрении заявки:\n\n\`${errorMessage}\``, {
          parse_mode: "Markdown",
        });
        return;
      }

      await ctx.reply(
        `✅ Заявка WR-${requestId} одобрена!\n\n` +
          `Статус изменен на: одобрено\n` +
          `Заявка будет обработана автоматически.`,
      );
    } catch (error) {
      console.error("[telegram-webhook] Error approving withdraw request:", error);
      await ctx.reply("❌ Ошибка при одобрении заявки").catch(() => {});
    }
  });

  // Handle withdraw reject button
  bot.action(/^withdraw_reject_(.+)$/, async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const requestId = ctx.match[1];
    await ctx.answerCbQuery("⏳ Отклонение заявки...").catch(() => {});

    try {
      const appUrl = getAppUrl();
      const adminSecret = process.env.INTERNAL_BALANCE_SIGNING_SECRET;

      if (!adminSecret) {
        await ctx.reply("❌ Ошибка конфигурации: INTERNAL_BALANCE_SIGNING_SECRET не установлен");
        return;
      }

      const response = await fetch(`${appUrl}/api/internal-balance/withdraw/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-internal-admin-token": adminSecret,
        },
        body: JSON.stringify({
          status: "rejected",
          reviewerId: null, // reviewerId должен быть UUID пользователя из системы, а не Telegram ID
          notes: `Отклонено через Telegram бота пользователем ${ctx.from.first_name || ctx.from.username || "admin"} (Telegram ID: ${ctx.from.id})`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Неизвестная ошибка";
        await ctx.reply(`❌ Ошибка при отклонении заявки:\n\n\`${errorMessage}\``, {
          parse_mode: "Markdown",
        });
        return;
      }

      await ctx.reply(`❌ Заявка WR-${requestId} отклонена.\n\nСтатус изменен на: отклонено`);
    } catch (error) {
      console.error("[telegram-webhook] Error rejecting withdraw request:", error);
      await ctx.reply("❌ Ошибка при отклонении заявки").catch(() => {});
    }
  });

  bot.action(/^withdraw_refund_(?!confirm_|cancel_|user_)(.+)$/, async (ctx) => {
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const requestId = ctx.match[1];
    await ctx.answerCbQuery("⏳ Подготовка возврата...").catch(() => {});

    try {
      const request = await getWithdrawRequestById(requestId);

      if (!request) {
        await ctx.reply("❌ Заявка не найдена");
        return;
      }

      if (
        request.status !== "pending" &&
        request.status !== "approved" &&
        request.status !== "processing"
      ) {
        await ctx.reply(
          `ℹ️ Заявка WR-${requestId} уже в финальном статусе: ${getStatusName(request.status)}. Повторный возврат не выполнен.`,
        );
        return;
      }

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "✅ Подтвердить возврат",
            `withdraw_refund_confirm_${request.id}`,
          ),
          Markup.button.callback("❌ Отменить", `withdraw_refund_cancel_${request.id}`),
        ],
      ]);

      await ctx.reply(
        `⚠️ *Подтвердите возврат на баланс*\n\n` +
          `WR-${request.id}\n` +
          `Пользователь: ${request.userId ? `\`${request.userId}\`` : "не указан"}\n` +
          `Статус: ${getStatusName(request.status)}\n` +
          `Сумма: ${formatTokenMinorAmount(request.amount)} ${request.tokenSymbol}\n\n` +
          `После подтверждения pending будет отменен, а approved/processing будет переведен в failed с возвратом суммы.`,
        { parse_mode: "Markdown", ...keyboard },
      );
    } catch (error) {
      console.error("[telegram-webhook] Error preparing withdraw refund:", error);
      await ctx
        .reply(
          "❌ Ошибка при подготовке возврата: " +
            (error instanceof Error ? error.message : String(error)),
        )
        .catch(() => {});
    }
  });

  bot.action(/^withdraw_refund_confirm_(.+)$/, async (ctx) => {
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const requestId = ctx.match[1];
    await ctx.answerCbQuery("⏳ Возврат на баланс...").catch(() => {});

    try {
      const result = await refundWithdrawRequestToBalance({
        requestId,
        reviewerId: null,
        notes: `Возврат на баланс через Telegram бота: ${getAdminActor(ctx)}`,
      });

      let balanceLine = "";
      if (result.request.userId) {
        const snapshot = await getInternalBalanceSnapshot({
          userId: result.request.userId,
          walletAddress: result.request.walletAddress ?? null,
        });
        balanceLine = `\n\nДоступно сейчас: ${formatTokenMinorAmount(
          (
            BigInt(snapshot.balance.balance) -
            BigInt(snapshot.balance.pendingOnchain) -
            BigInt(snapshot.balance.lockedAmount)
          ).toString(),
          snapshot.decimals,
        )} ${snapshot.tokenSymbol}`;
      }

      await ctx.reply(
        `✅ Возврат обработан\n\n${formatRefundResults([result])}${balanceLine}`,
      );
    } catch (error) {
      console.error("[telegram-webhook] Error confirming withdraw refund:", error);
      await ctx
        .reply(
          "❌ Ошибка при возврате: " +
            (error instanceof Error ? error.message : String(error)),
        )
        .catch(() => {});
    }
  });

  bot.action(/^withdraw_refund_user_(?!confirm_|cancel_)(.+)$/, async (ctx) => {
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const userId = ctx.match[1];
    await ctx.answerCbQuery("⏳ Проверка активных заявок...").catch(() => {});

    try {
      if (!UUID_REGEX.test(userId)) {
        await ctx.reply("❌ Неверный ID пользователя");
        return;
      }

      const requests = await listActiveWithdrawRequestsByUserId(userId);
      if (requests.length === 0) {
        await ctx.reply(
          `📭 Активных заявок на вывод для пользователя \`${userId}\` не найдено.`,
          { parse_mode: "Markdown" },
        );
        return;
      }

      const total = requests.reduce((sum, item) => sum + BigInt(item.amount), BigInt(0));
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "✅ Подтвердить возврат всех",
            `withdraw_refund_user_confirm_${userId}`,
          ),
          Markup.button.callback("❌ Отменить", `withdraw_refund_user_cancel_${userId}`),
        ],
      ]);

      await ctx.reply(
        `⚠️ *Подтвердите массовый возврат*\n\n` +
          `ID пользователя: \`${userId}\`\n` +
          `Активных заявок: ${requests.length}\n` +
          `Сумма: ${formatTokenMinorAmount(total.toString())} ${requests[0]?.tokenSymbol || TOKEN_CONFIG.symbol}\n\n` +
          `Повторное подтверждение после успешного возврата не начислит деньги повторно: финальные заявки будут пропущены.`,
        { parse_mode: "Markdown", ...keyboard },
      );
    } catch (error) {
      console.error("[telegram-webhook] Error preparing user withdraw refund:", error);
      await ctx
        .reply(
          "❌ Ошибка при подготовке возврата: " +
            (error instanceof Error ? error.message : String(error)),
        )
        .catch(() => {});
    }
  });

  bot.action(/^withdraw_refund_user_confirm_(.+)$/, async (ctx) => {
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const userId = ctx.match[1];
    await ctx.answerCbQuery("⏳ Возврат активных заявок...").catch(() => {});

    try {
      if (!UUID_REGEX.test(userId)) {
        await ctx.reply("❌ Неверный ID пользователя");
        return;
      }

      const results = await refundActiveWithdrawRequestsForUser({
        userId,
        reviewerId: null,
        notes: `Массовый возврат на баланс через Telegram бота: ${getAdminActor(ctx)}`,
      });

      const walletAddress = results.find((result) => result.request.walletAddress)?.request
        .walletAddress;
      const snapshot = await getInternalBalanceSnapshot({
        userId,
        walletAddress: walletAddress ?? null,
      });
      const available =
        BigInt(snapshot.balance.balance) -
        BigInt(snapshot.balance.pendingOnchain) -
        BigInt(snapshot.balance.lockedAmount);

      await ctx.reply(
        `✅ Возврат активных заявок обработан\n\n` +
          `${formatRefundResults(results)}\n\n` +
          `Доступно сейчас: ${formatTokenMinorAmount(
            (available > BigInt(0) ? available : BigInt(0)).toString(),
            snapshot.decimals,
          )} ${snapshot.tokenSymbol}`,
      );
    } catch (error) {
      console.error("[telegram-webhook] Error confirming user withdraw refund:", error);
      await ctx
        .reply(
          "❌ Ошибка при возврате: " +
            (error instanceof Error ? error.message : String(error)),
        )
        .catch(() => {});
    }
  });

  bot.action(/^withdraw_refund_(?:user_)?cancel_(.+)$/, async (ctx) => {
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    await ctx.answerCbQuery("Отменено").catch(() => {});
    await ctx.reply("❌ Возврат отменен");
  });

  // Handle withdraw details button
  bot.action(/^withdraw_details_(.+)$/, async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const requestId = ctx.match[1];
    await ctx.answerCbQuery("⏳ Загрузка деталей...").catch(() => {});

    try {
      const request = await getWithdrawRequestById(requestId);

      if (!request) {
        await ctx.reply("❌ Заявка не найдена");
        return;
      }

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Одобрить", `withdraw_approve_${request.id}`),
          Markup.button.callback("❌ Отклонить", `withdraw_reject_${request.id}`),
        ],
        [Markup.button.callback("💰 Установить комиссию", `withdraw_set_fee_${request.id}`)],
        [Markup.button.callback("↩️ Вернуть на баланс", `withdraw_refund_${request.id}`)],
      ]);

      await ctx.reply(formatWithdrawRequestDetails(request), {
        parse_mode: "MarkdownV2",
        ...keyboard,
      });
    } catch (error) {
      console.error("[telegram-webhook] Error getting withdraw details:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await ctx
        .reply(`❌ Ошибка при получении деталей заявки:\n\n\`${errorMessage}\``, {
          parse_mode: "Markdown",
        })
        .catch(() => {});
    }
  });

  // Handle withdraw set fee button
  bot.action(/^withdraw_set_fee_(.+)$/, async (ctx) => {
    // 🔒 Authorization check
    if (!(await checkAccess(ctx))) {
      await ctx.answerCbQuery("🔒 Нет доступа").catch(() => {});
      return;
    }

    const requestId = ctx.match[1];
    const chatId = ctx.from.id;
    await ctx.answerCbQuery("⏳ Загрузка...").catch(() => {});

    try {
      const request = await getWithdrawRequestById(requestId);

      if (!request) {
        await ctx.reply("❌ Заявка не найдена");
        return;
      }

      // Can only set fee if request is pending or approved
      if (request.status !== "pending" && request.status !== "approved") {
        await ctx.reply(
          "❌ Комиссию можно установить только для заявок со статусом 'Ожидает' или 'Одобрено'",
        );
        return;
      }

      // Store pending fee setting
      pendingWithdrawFee.set(chatId, {
        requestId,
        step: "amount",
      });

      const currentFeeText = request.feeAmount
        ? `Текущая комиссия: ${request.feeAmount} ${request.tokenSymbol}\n\n`
        : "";

      await ctx.reply(
        `${currentFeeText}💰 *Установка комиссии для заявки WR-${requestId}*\n\n` +
          `Введите сумму комиссии в токенах (в формате: 1000000000000000000 для 1 токена с 18 десятичными знаками)\n\n` +
          `Или отправьте "0" или "нет" чтобы убрать комиссию.\n\n` +
          `Отправьте "отмена" чтобы отменить.`,
        { parse_mode: "Markdown" },
      );
    } catch (error) {
      console.error("[telegram-webhook] Error setting withdraw fee:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await ctx
        .reply(`❌ Ошибка:\n\n\`${errorMessage}\``, { parse_mode: "Markdown" })
        .catch(() => {});
    }
  });

  // Handle withdraw fee amount input (in text message handler)
  // This will be added to the existing text message handler
} // End of if (bot) block

export async function POST(request: NextRequest) {
  try {
    if (!bot) {
      return NextResponse.json(
        { error: "Telegram bot is not configured. Please set TELEGRAM_API_KEY." },
        { status: 503 },
      );
    }

    // Cache the app URL from request headers for use in bot handlers
    getAppUrl(request);

    const update = await request.json();

    // Process update with timeout protection
    // Telegram expects webhook response within 60 seconds, but we should respond faster
    const updatePromise = bot.handleUpdate(update);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Update processing timeout")), 55000),
    );

    await Promise.race([updatePromise, timeoutPromise]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error processing Telegram update:", error);
    // Still return success to prevent Telegram from retrying
    // The error is logged for debugging
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Telegram webhook is active" });
}
