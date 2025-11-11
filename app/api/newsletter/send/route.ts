import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      photoFileId,
      videoFileId,
      documentFileId,
      language = "ru",
      authToken
    } = body;

    // Simple auth check (should be replaced with proper auth)
    if (authToken !== process.env.NEWSLETTER_AUTH_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if we have at least some content
    if (!message && !photoFileId && !videoFileId && !documentFileId) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Get active subscribers (Telegram chat_id only)
    const subscribers = await query(
      `SELECT chat_id, language FROM newsletter_subscribers
       WHERE is_active = true AND chat_id IS NOT NULL AND (language = $1 OR language = 'all')`,
      [language],
    );

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send messages via Telegram
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_API_KEY;
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: "Telegram bot token not configured" }, { status: 500 });
    }

    // Determine which method to use based on media type
    let apiMethod = "sendMessage";
    let payload: Record<string, any> = {
      parse_mode: "Markdown",
    };

    if (photoFileId) {
      apiMethod = "sendPhoto";
      payload.photo = photoFileId;
      if (message) {
        payload.caption = message;
      }
    } else if (videoFileId) {
      apiMethod = "sendVideo";
      payload.video = videoFileId;
      if (message) {
        payload.caption = message;
      }
    } else if (documentFileId) {
      apiMethod = "sendDocument";
      payload.document = documentFileId;
      if (message) {
        payload.caption = message;
      }
    } else {
      // Text only
      payload.text = message;
    }

    for (const subscriber of subscribers.rows) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${apiMethod}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: subscriber.chat_id,
              ...payload,
            }),
          },
        );

        if (response.ok) {
          results.sent++;
        } else {
          results.failed++;
          const errorData = await response.json();
          results.errors.push(`Chat ${subscriber.chat_id}: ${errorData.description}`);
        }

        // Rate limiting: wait between messages
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        results.failed++;
        results.errors.push(`Error sending to ${subscriber.chat_id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: subscribers.rows.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json({ error: "Failed to send newsletter" }, { status: 500 });
  }
}
