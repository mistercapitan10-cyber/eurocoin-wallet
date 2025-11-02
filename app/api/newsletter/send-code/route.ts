import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { VerificationCodeEmail } from "@/emails/VerificationCodeEmail";

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Configure Nodemailer
async function sendEmail(email: string, code: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // eurocoinfinance@gmail.com
      pass: process.env.EMAIL_PASSWORD, // App password
    },
  });

  // Render email using React Email
  const emailHtml = await render(React.createElement(VerificationCodeEmail, { code }));

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Newsletter Subscription Confirmation - EuroCoin",
    html: emailHtml,
    text: `Your verification code: ${code}`,
  };

  return await transporter.sendMail(mailOptions);
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Генерируем код
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

    // Проверяем существующего подписчика
    const existing = await query("SELECT * FROM newsletter_subscribers WHERE email = $1", [email]);

    if (existing.rows.length > 0) {
      // Обновляем код
      await query(
        "UPDATE newsletter_subscribers SET verification_code = $1, code_expires_at = $2 WHERE email = $3",
        [code, expiresAt, email],
      );
    } else {
      // Создаем новую запись
      await query(
        "INSERT INTO newsletter_subscribers (email, verification_code, code_expires_at) VALUES ($1, $2, $3)",
        [email, code, expiresAt],
      );
    }

    // Send code to email
    try {
      await sendEmail(email, code);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return NextResponse.json(
        { error: "Failed to send email. Please check email configuration." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in send-code:", error);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
