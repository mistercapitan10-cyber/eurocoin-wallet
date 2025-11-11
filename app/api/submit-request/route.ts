import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { Markup } from "telegraf";
import { render } from "@react-email/render";
import { createInternalRequest } from "@/lib/database/queries";
import { notifyNewInternalRequest } from "@/lib/telegram/notify-admin";
import {
  createRequestFile,
  getRequestFilesByRequestId,
  deleteRequestFile,
} from "@/lib/database/file-queries";
import { sendFilesToTelegram } from "@/lib/telegram/send-files";
import { getTelegramApi } from "@/lib/telegram/bot";
import { InternalRequestEmail } from "@/emails/InternalRequestEmail";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface RequestFormData {
  requester: string;
  department: string;
  requestType: string;
  description: string;
  priority: "low" | "normal" | "high";
  walletAddress?: string;
  userId?: string; // For OAuth users
  email?: string; // For OAuth users
  files?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string; // base64
  }>;
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

      // Save files if provided
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          await createRequestFile({
            requestId: requestId,
            requestType: "internal",
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

    // Get environment variables
    const recipientEmail = process.env.RECIPIENT_EMAIL || "treasury@company.io";
    const senderEmail = process.env.SENDER_EMAIL || "noreply@company.io";

    // Map request types to readable labels
    const requestTypeMap: Record<string, string> = {
      topUp: "Token Top-up",
      withdraw: "Token Withdrawal",
      balance: "Balance Review",
      report: "Report Request",
      refund: "Refund Request",
    };

    // Map departments to readable labels
    const departmentMap: Record<string, string> = {
      finance: "Finance Department",
      aml: "AML/KYC Department",
      investment: "Investment Team",
      support: "Customer Support",
      legal: "Legal Department",
    };

    // Format email content
    const emailSubject = `[${data.priority.toUpperCase()}] ${requestTypeMap[data.requestType] || data.requestType} - ${data.requester}`;

    // Render email using React Email
    const emailHtml = await render(
      React.createElement(InternalRequestEmail, {
        requester: data.requester,
        department: departmentMap[data.department] || data.department,
        requestType: requestTypeMap[data.requestType] || data.requestType,
        priority: data.priority,
        description: data.description,
        filesCount: data.files?.length,
        submittedAt: new Date().toLocaleString(),
      }),
    );

    // Send email using Resend
    let emailData: { id: string } | undefined;
    if (resend) {
      const result = await resend.emails.send({
        from: senderEmail,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
      });

      if (result.error) {
        console.error("Resend error:", result.error);
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
      }

      emailData = result.data;
    }

    // Send notification to Telegram
    try {
      const managerChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
      if (managerChatId) {
        const filesInfo =
          data.files && data.files.length > 0
            ? `\n📎 *Прикрепленные файлы:* ${data.files.length} шт.`
            : "";

        const telegramMessage =
          `🔵 *Новая внутренняя заявка*\n\n` +
          `👤 Инициатор: ${data.requester}\n` +
          (data.walletAddress ? `💼 Кошелек: \`${data.walletAddress}\`\n` : "") +
          `🏢 Отдел: ${departmentMap[data.department] || data.department}\n` +
          `📋 Тип: ${requestTypeMap[data.requestType] || data.requestType}\n` +
          `📊 Приоритет: ${data.priority.toUpperCase()}\n` +
          `📝 Описание: ${data.description}\n` +
          filesInfo +
          `\n\n🆔 ID: \`${requestId}\``;

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

        await getTelegramApi().sendMessage(parseInt(managerChatId), telegramMessage, {
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
    } catch (telegramError) {
      console.error("Error sending to Telegram:", telegramError);
      // Don't fail the request if Telegram fails
    }

    // Send support messenger notification with inline buttons
    await notifyNewInternalRequest({
      id: requestId,
      requester: data.requester,
      walletAddress: data.walletAddress,
      department: departmentMap[data.department] || data.department,
      requestType: requestTypeMap[data.requestType] || data.requestType,
      priority: data.priority.toUpperCase(),
    }).catch((err) => {
      console.error("Failed to send support notification:", err);
      // Don't fail the request if notification fails
    });

    return NextResponse.json(
      { success: true, requestId, messageId: emailData?.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
