import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { Markup } from "telegraf";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { createExchangeRequest } from "@/lib/database/queries";
import { notifyNewExchangeRequest } from "@/lib/telegram/notify-admin";
import { auth } from "@/lib/auth";
import { getUserByWalletAddress } from "@/lib/database/user-queries";
import {
  createRequestFile,
  getRequestFilesByRequestId,
  deleteRequestFile,
} from "@/lib/database/file-queries";
import { sendFilesToTelegram } from "@/lib/telegram/send-files";
import { getTelegramApi } from "@/lib/telegram/bot";
import { ExchangeRequestEmail } from "@/emails/ExchangeRequestEmail";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface ExchangeRequest {
  tokenAmount: string;
  fiatAmount: string;
  walletAddress: string;
  email: string;
  commission: string;
  rate: string;
  comment?: string;
  files?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string; // base64
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const data: ExchangeRequest = await request.json();
    let userId = session?.user?.id || null;

    if (!userId && data.walletAddress) {
      try {
        const walletUser = await getUserByWalletAddress(data.walletAddress as `0x${string}`);
        userId = walletUser?.id ?? null;
      } catch (lookupError) {
        console.warn("[submit-exchange-request] Wallet lookup failed:", lookupError);
      }
    }

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
        user_id: userId ?? undefined,
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
    const filesInfo =
      data.files && data.files.length > 0
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

      await getTelegramApi().sendMessage(managerChatId, message, {
        parse_mode: "Markdown",
        ...keyboard,
      });

      // Send files separately if they exist
      if (data.files && data.files.length > 0) {
        const files = await getRequestFilesByRequestId(requestId);
        try {
          await sendFilesToTelegram(
            managerChatId,
            files.map((f) => ({
              id: f.id,
              fileName: f.file_name,
              fileType: f.file_type,
              fileSize: f.file_size,
              fileData: f.file_data,
            })),
          );
          // Delete files from DB after successful Telegram delivery
          for (const file of files) {
            await deleteRequestFile(file.id);
          }
          console.log(`✅ Deleted ${files.length} file(s) from database after Telegram delivery`);
        } catch (err) {
          console.error("Failed to send files to Telegram:", err);
          // Don't fail the request if file sending fails, keep files in DB
        }
      }
    }

    // Send support messenger notification with inline buttons
    await notifyNewExchangeRequest({
      id: requestId,
      walletAddress: data.walletAddress,
      userId: userId ?? undefined,
      email: data.email,
      tokenAmount: data.tokenAmount,
      fiatAmount: data.fiatAmount,
    }).catch((err) => {
      console.error("Failed to send support notification:", err);
      // Don't fail the request if notification fails
    });

    // Render email using React Email
    const emailHtml = await render(
      React.createElement(ExchangeRequestEmail, {
        requestId: requestId,
        tokenAmount: data.tokenAmount,
        fiatAmount: data.fiatAmount,
        rate: data.rate,
        commission: data.commission,
        walletAddress: data.walletAddress,
        email: data.email,
        comment: data.comment,
        filesCount: data.files?.length,
        submittedAt: new Date().toLocaleString("en-US"),
      }),
    );

    if (resend) {
      await resend.emails.send({
        from: process.env.SENDER_EMAIL!,
        to: process.env.RECIPIENT_EMAIL!,
        subject: `[EXCHANGE] Новая заявка ${requestId}`,
        html: emailHtml,
      });
    }

    return NextResponse.json({ success: true, requestId }, { status: 200 });
  } catch (error) {
    console.error("Error processing exchange request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
