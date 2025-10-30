import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { Telegraf, Markup } from "telegraf";
import { createInternalRequest } from "@/lib/database/queries";

const resend = new Resend(process.env.RESEND_API_KEY);
const bot = new Telegraf(process.env.TELEGRAM_API_KEY!);

interface RequestFormData {
  requester: string;
  department: string;
  requestType: string;
  description: string;
  priority: "low" | "normal" | "high";
  walletAddress?: string;
  userId?: string; // For OAuth users
  email?: string; // For OAuth users
}

export async function POST(request: NextRequest) {
  try {
    const data: RequestFormData = await request.json();

    // Validate required fields
    if (!data.requester || !data.department || !data.requestType || !data.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate request ID
    const requestId = `IR-${Date.now()}`;

    // Save to database
    try {
      await createInternalRequest({
        id: requestId,
        requester: data.requester,
        department: data.department,
        request_type: data.requestType,
        priority: data.priority,
        description: data.description,
        email: data.email || undefined, // Use email from form data
        wallet_address: data.walletAddress || undefined,
        user_id: data.userId, // For OAuth users
      });
    } catch (dbError) {
      console.error("Error saving to database:", dbError);
      return NextResponse.json({ error: "Failed to save request to database" }, { status: 500 });
    }

    // Get environment variables
    const recipientEmail = process.env.RECIPIENT_EMAIL || "treasury@company.io";
    const senderEmail = process.env.SENDER_EMAIL || "noreply@company.io";

    // Map request types to readable labels
    const requestTypeMap: Record<string, string> = {
      topUp: "Token Top-up",
      withdraw: "Token Withdrawal",
      balance: "Balance Review",
      report: "Report Request",
    };

    // Map departments to readable labels
    const departmentMap: Record<string, string> = {
      finance: "Finance Department",
      aml: "AML/KYC Department",
      investment: "Investment Team",
      support: "Customer Support",
    };

    // Format email content
    const emailSubject = `[${data.priority.toUpperCase()}] ${requestTypeMap[data.requestType] || data.requestType} - ${data.requester}`;

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
            .value { padding: 10px; background: white; border-radius: 4px; border-left: 3px solid #667eea; }
            .priority-badge { display: inline-block; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .priority-low { background: #d4edda; color: #155724; }
            .priority-normal { background: #fff3cd; color: #856404; }
            .priority-high { background: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Internal Token Operation Request</h2>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">Requester:</span>
                <div class="value">${data.requester}</div>
              </div>
              <div class="field">
                <span class="label">Department:</span>
                <div class="value">${departmentMap[data.department] || data.department}</div>
              </div>
              <div class="field">
                <span class="label">Request Type:</span>
                <div class="value">${requestTypeMap[data.requestType] || data.requestType}</div>
              </div>
              <div class="field">
                <span class="label">Priority:</span>
                <div class="value">
                  <span class="priority-badge priority-${data.priority}">
                    ${data.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <div class="field">
                <span class="label">Description:</span>
                <div class="value" style="white-space: pre-wrap;">${data.description}</div>
              </div>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">
                This request was submitted through the internal dashboard at ${new Date().toLocaleString()}.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: senderEmail,
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    // Send notification to Telegram
    try {
      const managerChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
      if (managerChatId) {
        const telegramMessage =
          `🔵 *Новая внутренняя заявка*\n\n` +
          `👤 Инициатор: ${data.requester}\n` +
          (data.walletAddress ? `💼 Кошелек: \`${data.walletAddress}\`\n` : "") +
          `🏢 Отдел: ${departmentMap[data.department] || data.department}\n` +
          `📋 Тип: ${requestTypeMap[data.requestType] || data.requestType}\n` +
          `📊 Приоритет: ${data.priority.toUpperCase()}\n` +
          `📝 Описание: ${data.description}\n\n` +
          `🆔 ID: \`${requestId}\``;

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

        await bot.telegram.sendMessage(parseInt(managerChatId), telegramMessage, {
          parse_mode: "Markdown",
          ...keyboard,
        });
      }
    } catch (telegramError) {
      console.error("Error sending to Telegram:", telegramError);
      // Don't fail the request if Telegram fails
    }

    return NextResponse.json(
      { success: true, requestId, messageId: emailData?.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
