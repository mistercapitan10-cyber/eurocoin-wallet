import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Нормализуем email
    const normalizedEmail = email.trim().toLowerCase();

    // Проверяем, подписан ли пользователь
    const result = await query(
      "SELECT verified, is_active FROM newsletter_subscribers WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ subscribed: false });
    }

    const subscriber = result.rows[0];
    const isSubscribed = subscriber.verified === true && subscriber.is_active === true;

    return NextResponse.json({
      subscribed: isSubscribed,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 });
  }
}
