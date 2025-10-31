import { NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";

/**
 * GET /api/telegram/get-chat-id
 * Fetches recent updates to find admin chat ID
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.TELEGRAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "TELEGRAM_API_KEY not set" }, { status: 500 });
    }

    const bot = new Telegraf(apiKey);

    // Get recent updates
    const updates = await bot.telegram.getUpdates({});

    if (updates.length === 0) {
      return NextResponse.json({
        message: "No updates found. Send a message to the bot first!",
        instructions:
          "Open Telegram and send any message to your bot, then try this endpoint again.",
      });
    }

    // Extract chat IDs from updates
    const chatIds = updates
      .map((update) => {
        if ("message" in update && update.message) {
          return {
            chat_id: update.message.chat.id,
            username: update.message.from?.username,
            first_name: update.message.from?.first_name,
            message: update.message.text,
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      chatIds,
      instructions: "Add one of these chat_id values to your .env.local as TELEGRAM_ADMIN_CHAT_ID",
    });
  } catch (error) {
    console.error("Error getting chat ID:", error);
    return NextResponse.json(
      {
        error: "Failed to get chat ID",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
