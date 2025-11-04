import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code || code.length !== 6) {
      return NextResponse.json({ error: "Invalid email or code" }, { status: 400 });
    }

    // Проверяем код
    const result = await query(
      "SELECT * FROM newsletter_subscribers WHERE email = $1 AND verification_code = $2",
      [email, code],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const subscriber = result.rows[0];
    const expiresAt = new Date(subscriber.code_expires_at);

    // Проверяем срок действия
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    // Подтверждаем email
    await query(
      "UPDATE newsletter_subscribers SET verified = true, is_active = true, verification_code = NULL, code_expires_at = NULL WHERE email = $1",
      [email],
    );

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error("Error in verify-code:", error);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}







