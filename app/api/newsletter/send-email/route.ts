import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";
import nodemailer from "nodemailer";

// Настройка Nodemailer
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { message, authToken } = await request.json();

    // Проверка токена
    if (authToken !== process.env.NEWSLETTER_AUTH_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Получаем всех верифицированных подписчиков
    const subscribers = await query(
      "SELECT email FROM newsletter_subscribers WHERE verified = true AND is_active = true AND email IS NOT NULL",
    );

    if (subscribers.rows.length === 0) {
      return NextResponse.json({ success: true, sent: 0, failed: 0, total: 0 });
    }

    const transporter = createTransporter();
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Отправляем письма
    for (const subscriber of subscribers.rows) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: subscriber.email,
          subject: "EuroCoin Newsletter",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #10b981;">EuroCoin Newsletter</h2>
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                ${message.replace(/\n/g, "<br>")}
              </div>
              <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                Вы получили это письмо, потому что подписаны на рассылку EuroCoin.<br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/newsletter/unsubscribe" style="color: #10b981;">Отписаться от рассылки</a>
              </p>
            </div>
          `,
          text: message,
        });
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to send to ${subscriber.email}: ${error}`);
        console.error(`Error sending to ${subscriber.email}:`, error);
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      total: subscribers.rows.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.slice(0, 10), // Limit errors
    });
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json({ error: "Failed to send newsletter" }, { status: 500 });
  }
}



