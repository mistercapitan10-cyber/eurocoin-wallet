import { NextRequest, NextResponse } from "next/server";
import { Telegraf, Markup } from "telegraf";
import { Resend } from "resend";
import { createExchangeRequest } from "@/lib/database/queries";
import { notifyNewExchangeRequest } from "@/lib/telegram/notify-admin";
import { createRequestFile, getRequestFilesByRequestId } from "@/lib/database/file-queries";
import { sendFilesToTelegram } from "@/lib/telegram/send-files";

const bot = new Telegraf(process.env.TELEGRAM_API_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

interface ExchangeRequest {
  tokenAmount: string;
  fiatAmount: string;
  walletAddress: string;
  email: string;
  commission: string;
  rate: string;
  comment?: string;
  userId?: string; // For OAuth users
  files?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string; // base64
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const data: ExchangeRequest = await request.json();

    // Validate required fields
    if (!data.tokenAmount || !data.fiatAmount || !data.walletAddress || !data.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate request ID
    const requestId = `EX-${Date.now()}`;

    // Save to database
    try {
      await createExchangeRequest({
        id: requestId,
        wallet_address: data.walletAddress,
        email: data.email,
        token_amount: data.tokenAmount,
        fiat_amount: data.fiatAmount,
        rate: data.rate,
        commission: data.commission,
        comment: data.comment,
        user_id: data.userId, // For OAuth users
      });

      // Save files if provided
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          await createRequestFile({
            requestId: requestId,
            requestType: "exchange",
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            fileData: file.fileData,
          });
        }
      }
    } catch (dbError) {
      console.error("Error saving to database:", dbError);
      return NextResponse.json({ error: "Failed to save request to database" }, { status: 500 });
    }

    // Prepare message for manager
    const filesInfo = data.files && data.files.length > 0 
      ? `\n📎 *Прикрепленные файлы:* ${data.files.length} шт.` 
      : "";

    const message = `
🔔 *Новая заявка на обмен токенов*

📋 *ID заявки:* ${requestId}
💰 *Сумма токенов:* ${data.tokenAmount} TOKEN
💵 *Сумма фиата:* ${data.fiatAmount} EUR
📊 *Курс:* ${data.rate}
💸 *Комиссия:* ${data.commission}%

💼 *Адрес кошелька:*
\`${data.walletAddress}\`

📧 *Email клиента:* ${data.email}
${data.comment ? `📝 *Комментарий:* ${data.comment}` : ""}
${filesInfo}

⏰ *Время:* ${new Date().toLocaleString("ru-RU")}
`;

    // Send to manager in Telegram
    const managerChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
    if (managerChatId) {
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ В обработке", `status_${requestId}_submitted`),
          Markup.button.callback("📄 Проверка", `status_${requestId}_checking`),
        ],
        [
          Markup.button.callback("🔍 Анализ", `status_${requestId}_analyzing`),
          Markup.button.callback("🕵️ Расследование", `status_${requestId}_investigating`),
        ],
        [
          Markup.button.callback("💰 Восстановление", `status_${requestId}_recovering`),
          Markup.button.callback("✅ Завершить", `status_${requestId}_completed`),
        ],
      ]);

      await bot.telegram.sendMessage(managerChatId, message, {
        parse_mode: "Markdown",
        ...keyboard,
      });

      // Send files separately if they exist
      if (data.files && data.files.length > 0) {
        const files = await getRequestFilesByRequestId(requestId);
        await sendFilesToTelegram(
          managerChatId,
          files.map((f) => ({
            id: f.id,
            fileName: f.file_name,
            fileType: f.file_type,
            fileSize: f.file_size,
            fileData: f.file_data instanceof Buffer
              ? f.file_data
              : Buffer.from(f.file_data, "base64"),
          })),
        ).catch((err) => {
          console.error("Failed to send files to Telegram:", err);
          // Don't fail the request if file sending fails
        });
      }
    }

    // Send support messenger notification with inline buttons
    await notifyNewExchangeRequest({
      id: requestId,
      walletAddress: data.walletAddress,
      email: data.email,
      tokenAmount: data.tokenAmount,
      fiatAmount: data.fiatAmount,
    }).catch((err) => {
      console.error('Failed to send support notification:', err);
      // Don't fail the request if notification fails
    });

    // Send email notification
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #667eea; display: block; margin-bottom: 5px; }
            .value { padding: 10px; background: white; border-radius: 4px; border-left: 3px solid #667eea; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🔔 Новая заявка на обмен токенов</h2>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">ID заявки:</span>
                <div class="value">${requestId}</div>
              </div>
              <div class="field">
                <span class="label">Сумма токенов:</span>
                <div class="value">${data.tokenAmount} TOKEN</div>
              </div>
              <div class="field">
                <span class="label">Сумма фиата:</span>
                <div class="value">${data.fiatAmount} EUR</div>
              </div>
              <div class="field">
                <span class="label">Курс:</span>
                <div class="value">${data.rate}</div>
              </div>
              <div class="field">
                <span class="label">Комиссия:</span>
                <div class="value">${data.commission}</div>
              </div>
              <div class="field">
                <span class="label">Адрес кошелька:</span>
                <div class="value">${data.walletAddress}</div>
              </div>
              <div class="field">
                <span class="label">Email клиента:</span>
                <div class="value">${data.email}</div>
              </div>
              ${
                data.comment
                  ? `
              <div class="field">
                <span class="label">Комментарий:</span>
                <div class="value">${data.comment}</div>
              </div>
              `
                  : ""
              }
              ${
                data.files && data.files.length > 0
                  ? `
              <div class="field">
                <span class="label">Прикрепленные файлы:</span>
                <div class="value">${data.files.length} шт.</div>
              </div>
              `
                  : ""
              }
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">
                Время: ${new Date().toLocaleString("ru-RU")}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: process.env.SENDER_EMAIL!,
      to: process.env.RECIPIENT_EMAIL!,
      subject: `[EXCHANGE] Новая заявка ${requestId}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, requestId }, { status: 200 });
  } catch (error) {
    console.error("Error processing exchange request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
