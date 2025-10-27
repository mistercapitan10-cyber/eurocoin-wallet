import { NextRequest, NextResponse } from "next/server";
import { Telegraf, Markup } from "telegraf";
import {
  getAllExchangeRequests,
  getAllInternalRequests,
  getExchangeRequestById,
  getInternalRequestById,
  updateExchangeRequestStatus,
  updateInternalRequestStatus,
  updateInternalRequestStage,
} from "@/lib/database/queries";

const bot = new Telegraf(process.env.TELEGRAM_API_KEY!);

// Helper function to call webhook
async function updateRequestStatus(requestId: string, status: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhook/update-request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      },
    );

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
    processing: "Выполняется",
    completed: "Завершена",
    rejected: "Отклонена",
    cancelled: "Отменена",
  };
  return names[status as keyof typeof names] || status;
}

// Start command
bot.start((ctx) => {
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
      `/details <ID> - детали заявки\n\n` +
      `Пример: /details EX-1234567890\n\n` +
      `Используйте /help для подробной справки.`,
  );
});

// Help command
bot.command("help", (ctx) => {
  const helpMessage = `
🤖 *Справка по командам бота*

📋 *Основные команды:*

/start - Начать работу с ботом
/help - Показать эту справку

📊 *Команды для просмотра заявок:*

/list - Показать все заявки (обмен + внутренние)
  ➡️ Выводит краткий список последних 5 заявок каждого типа с их статусами

/exchange - Показать заявки на обмен с кнопками управления
  ➡️ Отображает все заявки на обмен с возможностью изменения статуса через inline-кнопки
  ➡️ Поддерживает кнопки: Обработать, Завершить, Отклонить, Отменить

/internal - Показать внутренние заявки с кнопками управления
  ➡️ Отображает все внутренние заявки с возможностью изменения статуса
  ➡️ Поддерживает кнопки: Обработать, Завершить, Отклонить

/details <ID> - Показать детали конкретной заявки
  ➡️ Подробная информация о заявке по её ID
  ➡️ Пример: /details EX-1234567890
  ➡️ Отображает полную информацию и кнопки для управления

⚙️ *Изменить статус заявки:*

1. Используйте /exchange или /details <ID>
2. Выберите заявку с нужным статусом
3. Нажмите на одну из кнопок:
   🔄 Обработать (processing)
   ✅ Завершить (completed)
   ❌ Отклонить (rejected)
   🚫 Отменить (cancelled)

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
`;

  ctx.reply(helpMessage, { parse_mode: "Markdown" });
});

// List all requests
bot.command("list", async (ctx) => {
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
      message += `💰 ${req.token_amount} TOKEN → ${req.fiat_amount} RUB\n`;
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
      message += `💵 Фиат: ${request.fiat_amount} RUB\n`;
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

// Handle investigation status buttons
bot.action(/^status_(.+)_(.+)$/, async (ctx) => {
  const match = ctx.match;
  const requestId = match[1];
  const newStage = match[2];

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

    // Update database with both status and stage
    await updateInternalRequestStatus(
      requestId,
      dbStatus as "pending" | "processing" | "completed" | "rejected" | "cancelled",
    );

    // Also update current_stage field
    await updateInternalRequestStage(requestId, newStage);

    // Confirm to user
    const stageLabels: Record<string, string> = {
      submitted: "✅ Заявка подана",
      checking: "📄 Проверка документов",
      analyzing: "🔍 Анализ транзакций",
      investigating: "🕵️ Расследование",
      recovering: "💰 Восстановление средств",
      completed: "✅ Завершено",
    };

    ctx.answerCbQuery(`✅ Статус обновлен: ${stageLabels[newStage] || newStage}`);

    // Update the button text to show it was clicked
    const message = ctx.callbackQuery.message;
    if (
      message &&
      "reply_markup" in message &&
      message.reply_markup &&
      "inline_keyboard" in message.reply_markup
    ) {
      const keyboard = message.reply_markup.inline_keyboard;
      const newKeyboard = keyboard.map((row) =>
        row.map((btn) => {
          if ("data" in ctx.callbackQuery && btn.text) {
            const currentData = ctx.callbackQuery.data;
            return {
              ...btn,
              text:
                currentData && btn.text.includes(stageLabels[newStage]?.split(" ")[1] || "")
                  ? `✓ ${btn.text}`
                  : btn.text,
            };
          }
          return btn;
        }),
      );

      ctx.editMessageReplyMarkup({
        inline_keyboard: newKeyboard,
      });
    }
  } catch (error) {
    console.error("[telegram-webhook] Error updating investigation status:", error);
    console.error("[telegram-webhook] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId,
      newStage,
    });
    ctx.answerCbQuery("❌ Ошибка при обновлении статуса");
  }
});

// Handle action buttons
bot.action(/^action_(.+)_(.+)$/, async (ctx) => {
  try {
    const match = ctx.match;
    const requestId = match[1];
    const newStatus = match[2];

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
      ctx.answerCbQuery("❌ Неверный ID заявки");
      return;
    }

    // Update via webhook
    await updateRequestStatus(requestId, newStatus);

    // Respond to user
    const badge = getStatusBadge(newStatus);
    const statusName = getStatusName(newStatus);
    ctx.answerCbQuery(`✅ Статус обновлен: ${badge} ${statusName}`);
    ctx.editMessageText(
      `✅ *Статус обновлен*\n\n` + `ID: ${requestId}\n` + `Новый статус: ${badge} ${statusName}`,
      { parse_mode: "Markdown" },
    );
  } catch (error) {
    console.error("Error handling action:", error);
    ctx.answerCbQuery("❌ Ошибка при обновлении статуса");
  }
});

// Simple storage for pending replies (in-memory, will be reset on restart)
const pendingReplies = new Map<number, string>();

// Chatbot callback handler - handle reply button click
bot.action(/^reply_to_chat_(.+)$/, async (ctx) => {
  try {
    const sessionId = ctx.match[1];
    const chatId = ctx.chat?.id || ctx.from?.id;

    console.log("[telegram-webhook] Reply button clicked for session:", sessionId);

    if (chatId) {
      // Store session ID for this chat
      pendingReplies.set(chatId, sessionId);
    }

    ctx.answerCbQuery();

    // Send a message asking for the reply text
    await ctx.reply(
      `📝 Введите ваш ответ для пользователя:\n\n` +
        `Просто напишите сообщение, и оно будет автоматически отправлено пользователю.`,
    );

    return;
  } catch (error) {
    console.error("[telegram-webhook] Error handling reply button:", error);
    ctx.answerCbQuery("❌ Ошибка");
  }
});

// Chatbot handler - listen for admin replies
bot.on("text", async (ctx) => {
  // Skip if it's a command
  if (ctx.message.text.startsWith("/")) {
    return;
  }

  // Check if we're awaiting a reply from the button click
  const chatId = ctx.from.id;
  const pendingSessionId = pendingReplies.get(chatId);

  if (pendingSessionId) {
    const sessionId = pendingSessionId;
    const adminResponse = ctx.message.text;

    console.log("[telegram-webhook] Admin reply detected via button:", {
      sessionId,
      text: adminResponse,
      adminId: ctx.from.id,
    });

    // Clear the pending flag
    pendingReplies.delete(chatId);

    try {
      // Send response to user via API
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/chatbot/admin-response`;
      console.log("[telegram-webhook] Calling API:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          text: adminResponse,
          adminId: ctx.from.id,
        }),
      });

      console.log("[telegram-webhook] API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[telegram-webhook] Admin response saved:", data);
        ctx.reply("✅ Ответ отправлен пользователю");
      } else {
        const errorText = await response.text();
        console.error("[telegram-webhook] API error:", errorText);
        ctx.reply("❌ Ошибка при отправке ответа");
      }
    } catch (error) {
      console.error("[telegram-webhook] Error sending admin response:", error);
      ctx.reply("❌ Ошибка при отправке ответа");
    }
    return;
  }

  // Check if this is an admin reply to chatbot (legacy format)
  // Format: [reply-SESSION_ID] message text
  const match = ctx.message.text.match(/^\[reply-([^\]]+)\]\s*(.+)/);

  if (match && ctx.chat.type === "private") {
    const sessionId = match[1];
    const adminResponse = match[2];

    console.log("[telegram-webhook] Admin reply detected:", {
      sessionId,
      text: adminResponse,
      adminId: ctx.from.id,
    });

    try {
      // Send response to user via API
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/chatbot/admin-response`;
      console.log("[telegram-webhook] Calling API:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          text: adminResponse,
          adminId: ctx.from.id,
        }),
      });

      console.log("[telegram-webhook] API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[telegram-webhook] Admin response saved:", data);
        ctx.reply("✅ Ответ отправлен пользователю");
      } else {
        const errorText = await response.text();
        console.error("[telegram-webhook] API error:", errorText);
        ctx.reply("❌ Ошибка при отправке ответа");
      }
    } catch (error) {
      console.error("[telegram-webhook] Error sending admin response:", error);
      ctx.reply("❌ Ошибка при отправке ответа");
    }
    return;
  }

  // Default text handler
  ctx.reply(
    "Используйте команды:\n" +
      "/list - показать все заявки\n" +
      "/exchange - показать заявки на обмен\n" +
      "/internal - показать внутренние заявки\n" +
      "/details <ID> - детали заявки\n" +
      "/chats - активные чат-сессии\n\n" +
      "Для получения подробной справки используйте /help",
  );
});

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    await bot.handleUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error processing Telegram update:", error);
    return NextResponse.json({ error: "Failed to process update" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Telegram webhook is active" });
}
