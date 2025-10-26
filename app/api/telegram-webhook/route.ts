import { NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_API_KEY!);

bot.start((ctx) => {
  const chatId = ctx.chat.id;
  const username = ctx.from.first_name || "User";

  ctx.reply(
    `Привет, ${username}! 👋\n\n` +
      `Я бот для обработки заявок на обмен токенов.\n\n` +
      `Ваш ID: ${chatId}\n\n` +
      `Вы получите уведомления о статусе ваших заявок.`,
  );
});

bot.on("text", (ctx) => {
  ctx.reply("Используйте кнопки меню для управления заявками.");
});

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    await bot.handleUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error processing Telegram update:", error);
    return NextResponse.json({ error: "Failed to process update" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Telegram webhook is active" });
}
