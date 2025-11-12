import { Markup } from "telegraf";
import { getBot } from "./bot";

function getAdminChatId(): string | null {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId) {
    console.warn("⚠️  TELEGRAM_ADMIN_CHAT_ID is not set. Telegram notifications are disabled.");
    console.warn("    Send /myid command to your bot to get your Chat ID and add it to .env.local");
    return null;
  }
  return chatId;
}

// ============================================
// Exchange Request Notifications
// ============================================

export interface ExchangeRequestNotification {
  id: string;
  walletAddress: string;
  email: string;
  tokenAmount: string;
  fiatAmount: string;
}

/**
 * Отправляет уведомление о новой заявке на обмен токенов
 */
export async function notifyNewExchangeRequest(
  request: ExchangeRequestNotification,
): Promise<void> {
  try {
    const bot = getBot();
    const adminChatId = getAdminChatId();

    if (!adminChatId) {
      return; // Skip if chat ID not configured
    }

    const message = `
🔔 *Новая заявка на обмен токенов*

📋 *ID заявки:* EX\\-${escapeMarkdown(request.id)}
💼 *Кошелек:* \`${escapeMarkdown(request.walletAddress)}\`
📧 *Email:* ${escapeMarkdown(request.email)}
💰 *Сумма токенов:* ${escapeMarkdown(request.tokenAmount)}
💵 *Сумма фиата:* ${escapeMarkdown(request.fiatAmount)}
    `.trim();

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("💬 Отправить сообщение", `msg_${request.walletAddress}`),
        Markup.button.callback("📜 История чата", `history_${request.walletAddress}`),
      ],
    ]);

    await bot.telegram.sendMessage(adminChatId, message, {
      parse_mode: "MarkdownV2",
      ...keyboard,
    });
  } catch (error) {
    console.error("Error sending exchange request notification:", error);
    // Don't throw - notification failure shouldn't break the main flow
  }
}

// ============================================
// Internal Request Notifications
// ============================================

export interface InternalRequestNotification {
  id: string;
  requester: string;
  walletAddress?: string;
  department: string;
  requestType: string;
  priority: string;
}

/**
 * Отправляет уведомление о новой внутренней заявке
 */
export async function notifyNewInternalRequest(
  request: InternalRequestNotification,
): Promise<void> {
  try {
    const bot = getBot();
    const adminChatId = getAdminChatId();

    if (!adminChatId) {
      return; // Skip if chat ID not configured
    }

    const walletLine = request.walletAddress
      ? `💼 *Кошелек:* \`${escapeMarkdown(request.walletAddress)}\``
      : "";

    const message = `
🔔 *Новая внутренняя заявка*

📋 *ID заявки:* IR\\-${escapeMarkdown(request.id)}
👤 *Инициатор:* ${escapeMarkdown(request.requester)}
💼 *Отдел:* ${escapeMarkdown(request.department)}
📝 *Тип:* ${escapeMarkdown(request.requestType)}
⚡ *Приоритет:* ${escapeMarkdown(request.priority)}
${walletLine}
    `.trim();

    // Only show support messenger buttons if user has a valid wallet address
    // Support messenger requires valid Ethereum address format (0x...)
    const hasValidWallet = request.walletAddress && isValidWalletAddress(request.walletAddress);

    const keyboard = hasValidWallet
      ? Markup.inlineKeyboard([
          [
            Markup.button.callback("💬 Отправить сообщение", `msg_${request.walletAddress}`),
            Markup.button.callback("📜 История чата", `history_${request.walletAddress}`),
          ],
        ])
      : undefined;

    await bot.telegram.sendMessage(adminChatId, message, {
      parse_mode: "MarkdownV2",
      ...(keyboard || {}),
    });
  } catch (error) {
    console.error("Error sending internal request notification:", error);
    // Don't throw - notification failure shouldn't break the main flow
  }
}

// ============================================
// Withdraw Request Notifications
// ============================================

export interface WithdrawRequestNotification {
  id: string;
  walletAddress: string;
  amount: string;
  tokenSymbol: string;
  destinationAddress: string;
}

export async function notifyNewWithdrawRequest(
  payload: WithdrawRequestNotification,
): Promise<void> {
  try {
    const bot = getBot();
    const adminChatId = getAdminChatId();

    if (!adminChatId) {
      return;
    }

    const requestId = `WR-${payload.id}`;

    const message = `
🏦 *Новая заявка на вывод*

🧾 *ID:* WR\\-${escapeMarkdown(payload.id)}
💼 *Кошелек:* \`${escapeMarkdown(payload.walletAddress)}\`
🎯 *Адрес вывода:* \`${escapeMarkdown(payload.destinationAddress)}\`
💰 *Сумма:* ${escapeMarkdown(payload.amount)} ${escapeMarkdown(payload.tokenSymbol)}
    `.trim();

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("✅ Одобрить", `withdraw_approve_${payload.id}`),
        Markup.button.callback("❌ Отклонить", `withdraw_reject_${payload.id}`),
      ],
      [
        Markup.button.callback("📋 Детали", `withdraw_details_${payload.id}`),
        Markup.button.callback("💬 Сообщение", `msg_${payload.walletAddress}`),
      ],
    ]);

    await bot.telegram.sendMessage(adminChatId, message, {
      parse_mode: "MarkdownV2",
      ...keyboard,
    });
  } catch (error) {
    console.error("Error sending withdraw request notification:", error);
  }
}

export interface WithdrawStatusNotification {
  id: string;
  status: string;
  amount: string;
  tokenSymbol: string;
  destinationAddress: string;
  txHash?: string | null;
}

export async function notifyWithdrawStatusChange(
  payload: WithdrawStatusNotification,
): Promise<void> {
  try {
    const bot = getBot();
    const adminChatId = getAdminChatId();

    if (!adminChatId) {
      return;
    }

    const txLine = payload.txHash
      ? `🔗 *Tx:* [${payload.txHash.slice(0, 10)}…](https://etherscan.io/tx/${payload.txHash})\n`
      : "";

    const message = `
⚙️ *Обновление заявки на вывод*

🧾 *ID:* WR\\-${escapeMarkdown(payload.id)}
📊 *Статус:* ${escapeMarkdown(payload.status)}
💰 *Сумма:* ${escapeMarkdown(payload.amount)} ${escapeMarkdown(payload.tokenSymbol)}
🎯 *Адрес:* \`${escapeMarkdown(payload.destinationAddress)}\`
${txLine}`.trim();

    await bot.telegram.sendMessage(adminChatId, message, {
      parse_mode: "MarkdownV2",
    });
  } catch (error) {
    console.error("Error sending withdraw status notification:", error);
  }
}

// ============================================
// User Message Notifications
// ============================================

/**
 * Отправляет уведомление админу о новом сообщении от пользователя
 */
export async function notifyAdminNewMessage(
  userWallet: string,
  messageText: string,
): Promise<void> {
  try {
    const bot = getBot();
    const adminChatId = getAdminChatId();

    if (!adminChatId) {
      return; // Skip if chat ID not configured
    }

    // Truncate long messages
    const truncatedText =
      messageText.length > 500 ? messageText.substring(0, 500) + "..." : messageText;

    const message = `
💬 *Новое сообщение от пользователя*

👤 *Кошелек:* \`${escapeMarkdown(userWallet)}\`

💬 *Сообщение:*
${escapeMarkdown(truncatedText)}
    `.trim();

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("💬 Ответить", `reply_${userWallet}`),
        Markup.button.callback("📜 История", `history_${userWallet}`),
      ],
    ]);

    await bot.telegram.sendMessage(adminChatId, message, {
      parse_mode: "MarkdownV2",
      ...keyboard,
    });
  } catch (error) {
    console.error("Error sending user message notification:", error);
    // Don't throw - notification failure shouldn't break the main flow
  }
}

// ============================================
// Admin Reply Notifications (to user via website)
// ============================================

/**
 * Отправляет уведомление пользователю о новом ответе админа (через WebSocket/SSE)
 * В текущей реализации используется polling, поэтому эта функция может быть расширена
 */
export async function notifyUserNewAdminMessage(
  userWallet: string,
  messageText: string,
  adminUsername: string,
): Promise<void> {
  // TODO: Implement WebSocket/SSE notification when available
  // For now, the frontend uses polling to fetch new messages
  console.log(`New admin message for user ${userWallet} from ${adminUsername}`);
}

// ============================================
// Newsletter Subscription Notifications
// ============================================

/**
 * Отправляет уведомление админу о новой подписке на рассылку
 */
export async function notifyNewsletterSubscription(email: string): Promise<void> {
  try {
    const bot = getBot();
    const adminChatId = getAdminChatId();

    if (!adminChatId) {
      return; // Skip if chat ID not configured
    }

    const message = `
📧 *Новая подписка на рассылку*

📬 *Email:* ${escapeMarkdown(email)}
🕐 *Время:* ${escapeMarkdown(new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }))}
    `.trim();

    await bot.telegram.sendMessage(adminChatId, message, {
      parse_mode: "MarkdownV2",
    });
  } catch (error) {
    console.error("Error sending newsletter subscription notification:", error);
    // Don't throw - notification failure shouldn't break the main flow
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Escapes special characters for Telegram MarkdownV2
 */
export function escapeMarkdown(text: string): string {
  // MarkdownV2 special characters that need to be escaped
  const specialChars = [
    "_",
    "*",
    "[",
    "]",
    "(",
    ")",
    "~",
    "`",
    ">",
    "#",
    "+",
    "-",
    "=",
    "|",
    "{",
    "}",
    ".",
    "!",
  ];
  let escaped = text;

  for (const char of specialChars) {
    escaped = escaped.split(char).join(`\\${char}`);
  }

  return escaped;
}

/**
 * Formats wallet address for display (shows first 6 and last 4 characters)
 */
export function formatWalletAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Validates wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Sanitize message text (remove HTML, limit length)
 */
export function sanitizeMessageText(text: string, maxLength: number = 2000): string {
  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

// ============================================
// Bot Helper Functions
// ============================================

/**
 * Send a typing action to show the bot is processing
 */
export async function sendTypingAction(chatId: string | number): Promise<void> {
  try {
    const bot = getBot();
    await bot.telegram.sendChatAction(chatId, "typing");
  } catch (error) {
    console.error("Error sending typing action:", error);
  }
}

/**
 * Format chat history for Telegram display
 */
export function formatChatHistoryForTelegram(
  messages: Array<{
    type: string;
    text: string;
    admin_username?: string;
    created_at: Date | string;
  }>,
): string {
  if (messages.length === 0) {
    return "📭 История чата пуста";
  }

  let historyText = `📜 *Последние ${messages.length} сообщений:*\n\n`;

  messages.forEach((msg, index) => {
    const sender = msg.type === "user" ? "👤 Пользователь" : `👨‍💼 ${msg.admin_username || "Админ"}`;

    const date = new Date(msg.created_at);
    const dateStr = date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const truncatedText = msg.text.length > 100 ? msg.text.substring(0, 100) + "..." : msg.text;

    historyText += `${index + 1}\\. ${escapeMarkdown(sender)}\n`;
    historyText += `   ${escapeMarkdown(truncatedText)}\n`;
    historyText += `   🕐 ${escapeMarkdown(dateStr)}\n\n`;
  });

  return historyText;
}

/**
 * Test notification function (for debugging)
 */
export async function sendTestNotification(): Promise<void> {
  try {
    const bot = getBot();
    const adminChatId = getAdminChatId();

    if (!adminChatId) {
      throw new Error("TELEGRAM_ADMIN_CHAT_ID is not configured. Use /myid command in your bot.");
    }

    await bot.telegram.sendMessage(
      adminChatId,
      "✅ Test notification - Support messenger system is working!",
      { parse_mode: "Markdown" },
    );
  } catch (error) {
    console.error("Error sending test notification:", error);
    throw error;
  }
}
