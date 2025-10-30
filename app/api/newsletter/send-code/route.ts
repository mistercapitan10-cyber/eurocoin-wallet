import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";
import nodemailer from "nodemailer";

// Генерация 6-значного кода
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Настройка Nodemailer
async function sendEmail(email: string, code: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // eurocoinfinance@gmail.com
      pass: process.env.EMAIL_PASSWORD, // App password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Код подтверждения подписки - EuroCoin",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Подтверждение подписки на рассылку</h2>
        <p>Ваш код подтверждения:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981; border-radius: 8px;">
          ${code}
        </div>
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">Этот код действителен в течение 5 минут.</p>
        <p style="margin-top: 20px; color: #9ca3af; font-size: 12px;">Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
      </div>
    `,
    text: `Ваш код подтверждения: ${code}`,
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

    // Отправляем код на email
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


