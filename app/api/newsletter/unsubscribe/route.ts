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

    // Удаляем подписчика из базы данных
    const result = await query(
      "DELETE FROM newsletter_subscribers WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) RETURNING email",
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    console.log("[unsubscribe] Unsubscribed:", normalizedEmail);

    return NextResponse.json({
      success: true,
      message: "Successfully unsubscribed",
    });
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
