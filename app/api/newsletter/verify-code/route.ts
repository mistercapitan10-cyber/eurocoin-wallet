import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { ThankYouEmail } from "@/emails/ThankYouEmail";
import { notifyNewsletterSubscription } from "@/lib/telegram/notify-admin";

// Send thank you email using Resend API
async function sendThankYouEmail(email: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.SENDER_EMAIL || process.env.EMAIL_USER || "noreply@resend.dev";

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(resendApiKey);

  // Render email using React Email
  let emailHtml: string;
  try {
    emailHtml = await render(React.createElement(ThankYouEmail, { email }));
  } catch (renderError) {
    console.error("Error rendering thank you email template:", renderError);
    throw new Error(
      `Failed to render email template: ${renderError instanceof Error ? renderError.message : "Unknown error"}`,
    );
  }

  // Отправляем email через Resend API с таймаутом
  try {
    const sendPromise = resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Thank You for Subscribing to EuroCoin Newsletter!",
      html: emailHtml,
      text: "Thank you for subscribing to EuroCoin newsletter! We're excited to have you join our community.",
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
    console.error("Error sending thank you email via Resend:", sendError);
    throw sendError;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code || code.length !== 6) {
      return NextResponse.json({ error: "Invalid email or code" }, { status: 400 });
    }

    // Нормализуем email и код (убираем пробелы, приводим к нижнему регистру)
    const normalizedEmail = email.trim().toLowerCase();
    // Нормализуем код: убираем все пробелы и нецифровые символы, приводим к строке
    const normalizedCode = String(code).trim().replace(/\D/g, "").padStart(6, "0");

    if (normalizedCode.length !== 6) {
      return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
    }

    console.log("[verify-code] Verifying code:", {
      email: normalizedEmail,
      codeLength: normalizedCode.length,
      code: normalizedCode,
      codeType: typeof normalizedCode,
    });

    // Проверяем код - используем TRIM и CAST для надежного сравнения
    // Сначала находим по email, потом сравниваем коды в коде для большей надежности
    const emailResult = await query(
      "SELECT * FROM newsletter_subscribers WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
      [normalizedEmail],
    );

    if (emailResult.rows.length === 0) {
      console.log("[verify-code] No subscriber found for email:", normalizedEmail);
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const subscriber = emailResult.rows[0];

    // Нормализуем сохраненный код для сравнения
    const storedCode = String(subscriber.verification_code || "").trim();
    const storedCodeNormalized = storedCode.replace(/\D/g, "").padStart(6, "0");

    console.log("[verify-code] Comparing codes:", {
      storedCodeRaw: subscriber.verification_code,
      storedCodeNormalized: storedCodeNormalized,
      providedCode: normalizedCode,
      codesMatch: storedCodeNormalized === normalizedCode,
    });

    // Сравниваем нормализованные коды
    if (storedCodeNormalized !== normalizedCode) {
      console.log("[verify-code] Code mismatch:", {
        storedCodeNormalized,
        providedCode: normalizedCode,
      });
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Проверяем наличие срока действия
    if (!subscriber.code_expires_at) {
      console.log("[verify-code] Code found but expires_at is null");
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const expiresAt = new Date(subscriber.code_expires_at);
    const now = new Date();

    console.log("[verify-code] Checking expiration:", {
      expiresAt: expiresAt.toISOString(),
      now: now.toISOString(),
      isExpired: expiresAt < now,
    });

    // Проверяем срок действия
    if (expiresAt < now) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    // Подтверждаем email
    await query(
      "UPDATE newsletter_subscribers SET verified = true, is_active = true, verification_code = NULL, code_expires_at = NULL WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
      [normalizedEmail],
    );

    console.log("[verify-code] Code verified successfully for:", normalizedEmail);

    // Отправляем благодарственное письмо пользователю
    try {
      await sendThankYouEmail(email.trim());
      console.log("[verify-code] Thank you email sent to:", email);
    } catch (emailError) {
      console.error("[verify-code] Error sending thank you email:", emailError);
      // Не прерываем процесс, если email не отправился
    }

    // Отправляем уведомление админу в Telegram
    try {
      await notifyNewsletterSubscription(email.trim());
      console.log("[verify-code] Telegram notification sent for:", email);
    } catch (telegramError) {
      console.error("[verify-code] Error sending Telegram notification:", telegramError);
      // Не прерываем процесс, если уведомление не отправилось
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error("Error in verify-code:", error);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}
