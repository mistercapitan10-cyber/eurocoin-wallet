import { NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";
import { Resend } from "resend";

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

    // Prepare message for manager
    const message = `
🔔 *Новая заявка на обмен токенов*

📋 *ID заявки:* ${requestId}
💰 *Сумма токенов:* ${data.tokenAmount} TOKEN
💵 *Сумма фиата:* ${data.fiatAmount} RUB
📊 *Курс:* ${data.rate} RUB за 1 TOKEN
💸 *Комиссия:* ${data.commission}%

💼 *Адрес кошелька:*
\`${data.walletAddress}\`

📧 *Email клиента:* ${data.email}
${data.comment ? `📝 *Комментарий:* ${data.comment}` : ""}

⏰ *Время:* ${new Date().toLocaleString("ru-RU")}
`;

    // Send to manager in Telegram
    const managerChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
    if (managerChatId) {
      await bot.telegram.sendMessage(managerChatId, message, { parse_mode: "Markdown" });
    }

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
                <div class="value">${data.fiatAmount} RUB</div>
              </div>
              <div class="field">
                <span class="label">Курс:</span>
                <div class="value">${data.rate} RUB за 1 TOKEN</div>
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
