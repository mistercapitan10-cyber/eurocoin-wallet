import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { VerificationCodeEmail } from "@/emails/VerificationCodeEmail";

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send email using Resend API
async function sendEmail(email: string, code: string) {
  // Проверка переменных окружения
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.SENDER_EMAIL || process.env.EMAIL_USER || "noreply@resend.dev";

  if (!resendApiKey) {
    throw new Error(
      "Email configuration is missing. Please set RESEND_API_KEY environment variable.",
    );
  }

  const resend = new Resend(resendApiKey);

  // Render email using React Email
  let emailHtml: string;
  try {
    emailHtml = await render(React.createElement(VerificationCodeEmail, { code }));
  } catch (renderError) {
    console.error("Error rendering email template:", renderError);
    throw new Error(
      `Failed to render email template: ${renderError instanceof Error ? renderError.message : "Unknown error"}`,
    );
  }

  // Отправляем email через Resend API с таймаутом
  try {
    const sendPromise = resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Newsletter Subscription Confirmation - EuroCoin",
      html: emailHtml,
      text: `Your verification code: ${code}`,
    });

    const result = await Promise.race([
      sendPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Email sending timeout after 15 seconds")), 15000),
      ),
    ]);

    if (result.error) {
      console.error("Resend API error:", result.error);
      throw new Error(`Resend API error: ${result.error.message || JSON.stringify(result.error)}`);
    }

    return result.data;
  } catch (sendError) {
    console.error("Error sending email via Resend:", sendError);
    throw sendError;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Проверка конфигурации email перед началом работы
    if (!process.env.RESEND_API_KEY) {
      console.error("Email configuration missing: RESEND_API_KEY not set");
      return NextResponse.json(
        { error: "Email service is not configured. Please contact administrator." },
        { status: 503 },
      );
    }

    // Генерируем код и убеждаемся, что это строка
    const code = String(generateCode()).padStart(6, "0"); // Гарантируем 6 цифр и строковый тип
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

    // Нормализуем email (убираем пробелы, приводим к нижнему регистру)
    const normalizedEmail = email.trim().toLowerCase();

    console.log("[send-code] Generating code:", {
      email: normalizedEmail,
      code: code,
      codeType: typeof code,
      expiresAt: expiresAt.toISOString(),
    });

    // Проверяем существующего подписчика
    let existing;
    try {
      existing = await query(
        "SELECT * FROM newsletter_subscribers WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
        [normalizedEmail],
      );
    } catch (dbError) {
      console.error("Database error when checking subscriber:", dbError);
      return NextResponse.json(
        { error: "Database error. Please try again later." },
        { status: 500 },
      );
    }

    if (existing.rows.length > 0) {
      // Обновляем код
      try {
        const updateResult = await query(
          "UPDATE newsletter_subscribers SET verification_code = $1, code_expires_at = $2 WHERE LOWER(TRIM(email)) = LOWER(TRIM($3)) RETURNING email, verification_code",
          [code, expiresAt, normalizedEmail],
        );
        console.log("[send-code] Updated existing subscriber:", {
          email: updateResult.rows[0]?.email,
          storedCode: updateResult.rows[0]?.verification_code,
        });
      } catch (dbError) {
        console.error("Database error when updating subscriber:", dbError);
        return NextResponse.json(
          { error: "Database error. Please try again later." },
          { status: 500 },
        );
      }
    } else {
      // Создаем новую запись
      try {
        const insertResult = await query(
          "INSERT INTO newsletter_subscribers (email, verification_code, code_expires_at) VALUES ($1, $2, $3) RETURNING email, verification_code",
          [normalizedEmail, code, expiresAt],
        );
        console.log("[send-code] Created new subscriber:", {
          email: insertResult.rows[0]?.email,
          storedCode: insertResult.rows[0]?.verification_code,
        });
      } catch (dbError) {
        console.error("Database error when creating subscriber:", dbError);
        return NextResponse.json(
          { error: "Database error. Please try again later." },
          { status: 500 },
        );
      }
    }

    // Send code to email (используем оригинальный email для отправки, но сохраняем нормализованный)
    try {
      await sendEmail(email.trim(), code); // Используем оригинальный email для отправки
      console.log(`Verification code sent successfully to ${email}`);
    } catch (emailError) {
      console.error("Error sending email:", emailError);

      // Удаляем сохраненный код, если email не отправился
      try {
        await query(
          "UPDATE newsletter_subscribers SET verification_code = NULL, code_expires_at = NULL WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
          [normalizedEmail],
        );
      } catch (cleanupError) {
        console.error("Error cleaning up verification code:", cleanupError);
      }

      const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";

      // Более детальные сообщения об ошибках
      if (errorMessage.includes("timeout")) {
        return NextResponse.json(
          { error: "Email service timeout. Please try again later." },
          { status: 504 },
        );
      } else if (
        errorMessage.includes("Resend API") ||
        errorMessage.includes("configuration") ||
        errorMessage.includes("RESEND_API_KEY")
      ) {
        return NextResponse.json(
          { error: "Email service configuration error. Please contact administrator." },
          { status: 503 },
        );
      } else {
        return NextResponse.json(
          { error: `Failed to send email: ${errorMessage}` },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in send-code:", error);

    // Обработка ошибок парсинга JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to send code. Please try again later." },
      { status: 500 },
    );
  }
}
