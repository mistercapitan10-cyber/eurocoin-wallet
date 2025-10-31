# План реализации мессенджера с интеграцией Telegram бота

## 📋 Обзор

Реализация системы мессенджера для общения пользователей с технической поддержкой через сайт и Telegram бота для администраторов.

**Основные требования:**

- Уведомления в Telegram о новых заявках (обмен токенов и внутренние)
- Отправка сообщений пользователям из Telegram бота
- Просмотр истории чата (последние 10 сообщений) из Telegram
- Отправка сообщений пользователями на сайте
- Показ статуса "печатает..." при наборе текста админом
- Звуковой сигнал при получении сообщения

---

## 🏗️ Архитектура решения

### Технологический стек

| Компонент        | Технология                           | Назначение                                   |
| ---------------- | ------------------------------------ | -------------------------------------------- |
| **Backend API**  | Next.js API Routes                   | Обработка сообщений, WebSocket для real-time |
| **Database**     | PostgreSQL                           | Хранение сообщений и сессий                  |
| **Telegram Bot** | Telegraf                             | Интерфейс для администраторов                |
| **Real-time**    | Server-Sent Events (SSE) или Polling | Обновление сообщений на фронтенде            |
| **WebSocket**    | Опционально: Socket.io               | Для статуса "печатает..."                    |
| **Audio**        | HTML5 Audio API                      | Воспроизведение звуков уведомлений           |

---

## 📊 Схема базы данных

### Расширение существующих таблиц

#### 1. Таблица `support_messages` (новая)

```sql
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
  user_wallet_address VARCHAR(42) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('user', 'admin', 'system')),
  text TEXT NOT NULL,
  admin_id BIGINT, -- Telegram chat_id админа
  admin_username VARCHAR(255), -- Имя админа из Telegram
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_messages_session ON support_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_wallet ON support_messages(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_unread ON support_messages(user_wallet_address, is_read) WHERE is_read = FALSE;
```

#### 2. Таблица `typing_indicators` (новая)

```sql
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet_address VARCHAR(42) NOT NULL,
  admin_id BIGINT NOT NULL,
  admin_username VARCHAR(255),
  is_typing BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 seconds'
);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_wallet ON typing_indicators(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires ON typing_indicators(expires_at);
```

#### 3. Расширение `chatbot_sessions`

Добавить поля:

```sql
ALTER TABLE chatbot_sessions ADD COLUMN IF NOT EXISTS last_admin_message_at TIMESTAMP;
ALTER TABLE chatbot_sessions ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;
```

---

## 🔄 Потоки данных

### 1. Уведомления о новых заявках в Telegram

```
User submits request
  ↓
API endpoint (submit-exchange-request / submit-request)
  ↓
Save to database (exchange_requests / internal_requests)
  ↓
Send notification to Telegram bot
  ↓
Admin sees notification with buttons:
  - "Отправить сообщение" → opens chat
  - "Посмотреть историю" → shows last 10 messages
```

**Файлы для изменения:**

- `app/api/submit-exchange-request/route.ts` - добавить отправку уведомления
- `app/api/submit-request/route.ts` - добавить отправку уведомления
- `app/api/telegram-webhook/route.ts` - добавить обработчики новых команд

---

### 2. Отправка сообщения из Telegram пользователю

```
Admin types message in Telegram bot
  ↓
Bot handler processes message
  ↓
Save to support_messages table
  ↓
WebSocket/SSE sends to frontend
  ↓
User sees message in chat window
  ↓
Play notification sound
```

**Новые файлы:**

- `app/api/support/send-admin-message/route.ts` - API для отправки сообщения
- `app/api/support/get-typing-status/route.ts` - API для статуса "печатает"

---

### 3. Отправка сообщения с сайта админу в Telegram

```
User types message on website
  ↓
API: /api/support/send-user-message
  ↓
Save to support_messages table
  ↓
Send notification to Telegram bot (admin)
  ↓
Admin receives message in Telegram
```

**Новые файлы:**

- `app/api/support/send-user-message/route.ts` - API для отправки сообщения пользователем
- `lib/telegram/notify-admin.ts` - Утилита для отправки уведомлений в Telegram

---

### 4. Просмотр истории чата из Telegram

```
Admin clicks "Посмотреть историю чата"
  ↓
Bot sends callback with wallet_address
  ↓
API: /api/support/get-chat-history
  ↓
Query last 10 messages from database
  ↓
Format and send to admin in Telegram
```

**Новые файлы:**

- `app/api/support/get-chat-history/route.ts` - API для получения истории
- Расширение `app/api/telegram-webhook/route.ts` - обработка callback

---

### 5. Статус "печатает..."

```
Admin starts typing in Telegram
  ↓
Bot handler detects typing
  ↓
Update typing_indicators table
  ↓
Frontend polls /api/support/get-typing-status
  ↓
Show "Админ печатает..." in chat window
```

**Новые файлы:**

- `app/api/support/set-typing/route.ts` - API для установки статуса
- Hook: `hooks/use-typing-indicator.ts` - хук для отслеживания статуса

---

## 📁 Структура файлов

### Новые API endpoints

```
app/api/
├── support/
│   ├── send-user-message/route.ts      # Отправка сообщения пользователем
│   ├── send-admin-message/route.ts     # Отправка сообщения админом
│   ├── get-messages/route.ts           # Получение сообщений (обновить существующий)
│   ├── get-chat-history/route.ts       # История чата для Telegram
│   ├── set-typing/route.ts             # Установка статуса "печатает"
│   ├── get-typing-status/route.ts      # Получение статуса "печатает"
│   └── mark-read/route.ts              # Отметка сообщения как прочитанного
└── telegram/
    └── notify-admin/route.ts           # Уведомление админа о новом сообщении
```

### Новые компоненты

```
components/
├── support/
│   ├── support-messenger.tsx           # Главный компонент мессенджера
│   ├── message-list.tsx                # Список сообщений
│   ├── message-item.tsx                # Элемент сообщения
│   ├── typing-indicator.tsx            # Индикатор "печатает..."
│   └── notification-sound.tsx         # Компонент для звука
└── profile/
    └── support-chat-modal.tsx          # Модальное окно чата (открывается по клику на конверт)
```

### Новые хуки

```
hooks/
├── use-support-messages.ts             # Управление сообщениями поддержки
├── use-typing-indicator.ts             # Отслеживание статуса "печатает"
└── use-notification-sound.ts           # Воспроизведение звука уведомлений
```

### Утилиты

```
lib/
├── telegram/
│   ├── notify-admin.ts                 # Отправка уведомлений админу
│   └── bot-helpers.ts                  # Вспомогательные функции для бота
└── database/
    └── support-queries.ts              # SQL запросы для поддержки
```

---

## 🔧 Детальная реализация по этапам

### Этап 1: Расширение базы данных (1-2 часа)

**Задачи:**

1. Создать миграцию для новых таблиц
2. Добавить поля в существующие таблицы
3. Создать индексы
4. Протестировать миграцию

**Файлы:**

- `lib/database/migrations/add-support-messenger.sql`
- `lib/database/support-queries.ts`

**SQL миграция:**

```sql
-- Создание таблицы support_messages
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
  user_wallet_address VARCHAR(42) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('user', 'admin', 'system')),
  text TEXT NOT NULL,
  admin_id BIGINT,
  admin_username VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_support_messages_session ON support_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_wallet ON support_messages(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_unread ON support_messages(user_wallet_address, is_read) WHERE is_read = FALSE;

-- Таблица typing_indicators
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet_address VARCHAR(42) NOT NULL,
  admin_id BIGINT NOT NULL,
  admin_username VARCHAR(255),
  is_typing BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 seconds'
);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_wallet ON typing_indicators(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires ON typing_indicators(expires_at);

-- Расширение chatbot_sessions
ALTER TABLE chatbot_sessions ADD COLUMN IF NOT EXISTS last_admin_message_at TIMESTAMP;
ALTER TABLE chatbot_sessions ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Функция для очистки устаревших индикаторов печатания
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

---

### Этап 2: Утилиты для работы с Telegram (2-3 часа)

**Задачи:**

1. Создать функцию отправки уведомлений о новых заявках
2. Создать функцию отправки сообщений админу
3. Форматирование сообщений для Telegram

**Файл:** `lib/telegram/notify-admin.ts`

```typescript
import { Telegraf, Markup } from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_API_KEY!);

/**
 * Отправляет уведомление о новой заявке на обмен
 */
export async function notifyNewExchangeRequest(request: {
  id: string;
  walletAddress: string;
  email: string;
  tokenAmount: string;
  fiatAmount: string;
}) {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChatId) return;

  const message = `
🔔 *Новая заявка на обмен токенов*

📋 *ID заявки:* EX-${request.id}
💼 *Кошелек:* \`${request.walletAddress}\`
📧 *Email:* ${request.email}
💰 *Сумма токенов:* ${request.tokenAmount}
💵 *Сумма фиата:* ${request.fiatAmount}

[Просмотреть детали](#)
  `.trim();

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback("💬 Отправить сообщение", `msg_${request.walletAddress}`),
      Markup.button.callback("📜 История чата", `history_${request.walletAddress}`),
    ],
    [Markup.button.url("📋 Детали заявки", `/details EX-${request.id}`)],
  ]);

  await bot.telegram.sendMessage(adminChatId, message, {
    parse_mode: "Markdown",
    ...keyboard,
  });
}

/**
 * Отправляет уведомление о новой внутренней заявке
 */
export async function notifyNewInternalRequest(request: {
  id: string;
  requester: string;
  walletAddress?: string;
  department: string;
  requestType: string;
  priority: string;
}) {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChatId) return;

  const message = `
🔔 *Новая внутренняя заявка*

📋 *ID заявки:* IR-${request.id}
👤 *Инициатор:* ${request.requester}
💼 *Отдел:* ${request.department}
📝 *Тип:* ${request.requestType}
⚡ *Приоритет:* ${request.priority}
${request.walletAddress ? `💼 *Кошелек:* \`${request.walletAddress}\`` : ""}

[Просмотреть детали](#)
  `.trim();

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback(
        "💬 Отправить сообщение",
        `msg_${request.walletAddress || request.requester}`,
      ),
      Markup.button.callback(
        "📜 История чата",
        `history_${request.walletAddress || request.requester}`,
      ),
    ],
    [Markup.button.url("📋 Детали заявки", `/details IR-${request.id}`)],
  ]);

  await bot.telegram.sendMessage(adminChatId, message, {
    parse_mode: "Markdown",
    ...keyboard,
  });
}

/**
 * Отправляет сообщение админу о новом сообщении от пользователя
 */
export async function notifyAdminNewMessage(userWallet: string, messageText: string) {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChatId) return;

  const message = `
💬 *Новое сообщение от пользователя*

👤 *Кошелек:* \`${userWallet}\`
💬 *Сообщение:*
${messageText.substring(0, 500)}${messageText.length > 500 ? "..." : ""}
  `.trim();

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback("💬 Ответить", `reply_${userWallet}`),
      Markup.button.callback("📜 История", `history_${userWallet}`),
    ],
  ]);

  await bot.telegram.sendMessage(adminChatId, message, {
    parse_mode: "Markdown",
    ...keyboard,
  });
}
```

---

### Этап 3: API endpoints (4-5 часов)

#### 3.1. Отправка сообщения пользователем

**Файл:** `app/api/support/send-user-message/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";
import { notifyAdminNewMessage } from "@/lib/telegram/notify-admin";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, text, sessionId } = await request.json();

    if (!walletAddress || !text) {
      return NextResponse.json({ error: "Missing walletAddress or text" }, { status: 400 });
    }

    // Получить или создать сессию
    let session = sessionId;
    if (!session) {
      const sessionResult = await query(
        `INSERT INTO chatbot_sessions (user_wallet_address) 
         VALUES ($1) 
         ON CONFLICT (user_wallet_address) 
         DO UPDATE SET updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [walletAddress],
      );
      session = sessionResult.rows[0].id;
    }

    // Сохранить сообщение
    const result = await query(
      `INSERT INTO support_messages 
       (session_id, user_wallet_address, type, text, is_read) 
       VALUES ($1, $2, 'user', $3, FALSE)
       RETURNING *`,
      [session, walletAddress, text],
    );

    const message = result.rows[0];

    // Отправить уведомление админу в Telegram
    await notifyAdminNewMessage(walletAddress, text);

    // Обновить счетчик непрочитанных
    await query(
      `UPDATE chatbot_sessions 
       SET unread_count = unread_count + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [session],
    );

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Error sending user message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
```

#### 3.2. Отправка сообщения админом

**Файл:** `app/api/support/send-admin-message/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, text, adminId, adminUsername, sessionId } = await request.json();

    if (!walletAddress || !text || !adminId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Получить сессию
    let session = sessionId;
    if (!session) {
      const sessionResult = await query(
        `SELECT id FROM chatbot_sessions 
         WHERE user_wallet_address = $1 
         ORDER BY updated_at DESC LIMIT 1`,
        [walletAddress],
      );
      session = sessionResult.rows[0]?.id;
    }

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Сохранить сообщение
    const result = await query(
      `INSERT INTO support_messages 
       (session_id, user_wallet_address, type, text, admin_id, admin_username, is_read) 
       VALUES ($1, $2, 'admin', $3, $4, $5, FALSE)
       RETURNING *`,
      [session, walletAddress, text, adminId, adminUsername || null],
    );

    const message = result.rows[0];

    // Обновить сессию
    await query(
      `UPDATE chatbot_sessions 
       SET last_admin_message_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [session],
    );

    // Удалить индикатор печатания
    await query(
      `DELETE FROM typing_indicators 
       WHERE user_wallet_address = $1 AND admin_id = $2`,
      [walletAddress, adminId],
    );

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Error sending admin message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
```

#### 3.3. Получение сообщений (обновить существующий)

**Файл:** `app/api/support/get-messages/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("walletAddress");
    const sessionId = searchParams.get("sessionId");

    if (!walletAddress) {
      return NextResponse.json({ error: "Missing walletAddress" }, { status: 400 });
    }

    // Получить сессию
    let session = sessionId;
    if (!session) {
      const sessionResult = await query(
        `SELECT id FROM chatbot_sessions 
         WHERE user_wallet_address = $1 
         ORDER BY updated_at DESC LIMIT 1`,
        [walletAddress],
      );
      session = sessionResult.rows[0]?.id;
    }

    if (!session) {
      return NextResponse.json({ messages: [] });
    }

    // Получить сообщения
    const result = await query(
      `SELECT id, type, text, admin_username, created_at, is_read
       FROM support_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [session],
    );

    // Отметить сообщения как прочитанные
    await query(
      `UPDATE support_messages 
       SET is_read = TRUE 
       WHERE session_id = $1 AND type = 'admin' AND is_read = FALSE`,
      [session],
    );

    // Обновить счетчик непрочитанных
    await query(
      `UPDATE chatbot_sessions 
       SET unread_count = 0
       WHERE id = $1`,
      [session],
    );

    return NextResponse.json({
      messages: result.rows,
      sessionId: session,
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 });
  }
}
```

#### 3.4. История чата для Telegram

**Файл:** `app/api/support/get-chat-history/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("walletAddress");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!walletAddress) {
      return NextResponse.json({ error: "Missing walletAddress" }, { status: 400 });
    }

    // Получить последние сообщения
    const result = await query(
      `SELECT 
         sm.id, 
         sm.type, 
         sm.text, 
         sm.admin_username,
         sm.created_at,
         cs.user_wallet_address
       FROM support_messages sm
       JOIN chatbot_sessions cs ON sm.session_id = cs.id
       WHERE cs.user_wallet_address = $1
       ORDER BY sm.created_at DESC
       LIMIT $2`,
      [walletAddress, limit],
    );

    // Перевернуть порядок для хронологического отображения
    const messages = result.rows.reverse();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error getting chat history:", error);
    return NextResponse.json({ error: "Failed to get chat history" }, { status: 500 });
  }
}
```

#### 3.5. Управление статусом "печатает"

**Файл:** `app/api/support/set-typing/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, adminId, adminUsername, isTyping } = await request.json();

    if (!walletAddress || !adminId) {
      return NextResponse.json({ error: "Missing walletAddress or adminId" }, { status: 400 });
    }

    if (isTyping) {
      // Удалить старые индикаторы для этого админа
      await query(
        `DELETE FROM typing_indicators 
         WHERE user_wallet_address = $1 AND admin_id = $2`,
        [walletAddress, adminId],
      );

      // Добавить новый индикатор
      await query(
        `INSERT INTO typing_indicators 
         (user_wallet_address, admin_id, admin_username, is_typing, expires_at)
         VALUES ($1, $2, $3, TRUE, NOW() + INTERVAL '30 seconds')
         ON CONFLICT DO NOTHING`,
        [walletAddress, adminId, adminUsername || null],
      );
    } else {
      // Удалить индикатор
      await query(
        `DELETE FROM typing_indicators 
         WHERE user_wallet_address = $1 AND admin_id = $2`,
        [walletAddress, adminId],
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting typing status:", error);
    return NextResponse.json({ error: "Failed to set typing status" }, { status: 500 });
  }
}
```

**Файл:** `app/api/support/get-typing-status/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json({ error: "Missing walletAddress" }, { status: 400 });
    }

    // Очистить устаревшие индикаторы
    await query(`DELETE FROM typing_indicators WHERE expires_at < NOW()`);

    // Получить активные индикаторы
    const result = await query(
      `SELECT admin_id, admin_username, started_at
       FROM typing_indicators
       WHERE user_wallet_address = $1 AND is_typing = TRUE
       ORDER BY started_at DESC
       LIMIT 1`,
      [walletAddress],
    );

    if (result.rows.length > 0) {
      return NextResponse.json({
        isTyping: true,
        adminUsername: result.rows[0].admin_username || "Администратор",
      });
    }

    return NextResponse.json({ isTyping: false });
  } catch (error) {
    console.error("Error getting typing status:", error);
    return NextResponse.json({ error: "Failed to get typing status" }, { status: 500 });
  }
}
```

---

### Этап 4: Расширение Telegram бота (5-6 часов)

#### 4.1. Обработка callback кнопок

**Файл:** `app/api/telegram-webhook/route.ts` (добавить обработчики)

```typescript
// Обработка callback "Отправить сообщение"
bot.action(/^msg_(.+)/, async (ctx) => {
  const walletAddress = ctx.match[1];

  // Сохранить в сессию ожидания ответа
  pendingReplies.set(ctx.chat.id.toString(), {
    walletAddress,
    sessionId: null,
  });

  ctx.answerCbQuery();
  ctx.reply(
    `💬 Отправка сообщения пользователю\n\n` +
      `Кошелек: \`${walletAddress}\`\n\n` +
      `Напишите сообщение, которое хотите отправить:`,
  );
});

// Обработка callback "История чата"
bot.action(/^history_(.+)/, async (ctx) => {
  const walletAddress = ctx.match[1];

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/support/get-chat-history?walletAddress=${walletAddress}&limit=10`,
    );

    if (response.ok) {
      const data = await response.json();
      const messages = data.messages || [];

      if (messages.length === 0) {
        ctx.answerCbQuery();
        ctx.reply("📭 История чата пуста");
        return;
      }

      let historyText = `📜 *Последние ${messages.length} сообщений:*\n\n`;

      messages.forEach((msg: any, index: number) => {
        const sender =
          msg.type === "user" ? "👤 Пользователь" : `👨‍💼 ${msg.admin_username || "Админ"}`;
        const date = new Date(msg.created_at).toLocaleString("ru-RU");
        historyText += `${index + 1}. ${sender}\n`;
        historyText += `   ${msg.text.substring(0, 100)}${msg.text.length > 100 ? "..." : ""}\n`;
        historyText += `   🕐 ${date}\n\n`;
      });

      ctx.answerCbQuery();
      ctx.reply(historyText, { parse_mode: "Markdown" });
    } else {
      ctx.answerCbQuery();
      ctx.reply("❌ Ошибка при получении истории");
    }
  } catch (error) {
    console.error("Error getting chat history:", error);
    ctx.answerCbQuery();
    ctx.reply("❌ Ошибка при получении истории");
  }
});
```

#### 4.2. Обработка набора текста (typing indicator)

```typescript
// Отслеживание набора текста админом
const typingTimeouts = new Map<string, NodeJS.Timeout>();

bot.on("text", async (ctx) => {
  // Проверка, есть ли активный pending reply
  const pending = pendingReplies.get(ctx.chat.id.toString());

  if (pending) {
    // Если админ отвечает на сообщение пользователя
    const walletAddress = pending.walletAddress;

    // Установить статус "печатает"
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/support/set-typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress,
        adminId: ctx.from.id,
        adminUsername: ctx.from.first_name || "Администратор",
        isTyping: true,
      }),
    });

    // Установить таймер для отправки сообщения
    const timeoutKey = `${ctx.chat.id}_${walletAddress}`;
    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey)!);
    }

    typingTimeouts.set(
      timeoutKey,
      setTimeout(async () => {
        // Отправить сообщение
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/support/send-admin-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            text: ctx.message.text,
            adminId: ctx.from.id,
            adminUsername: ctx.from.first_name || "Администратор",
            sessionId: pending.sessionId,
          }),
        });

        // Удалить статус "печатает"
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/support/set-typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            adminId: ctx.from.id,
            isTyping: false,
          }),
        });

        pendingReplies.delete(ctx.chat.id.toString());
        typingTimeouts.delete(timeoutKey);
      }, 2000), // Задержка 2 секунды перед отправкой
    );

    ctx.reply("✅ Сообщение отправлено! Напишите следующее или используйте /cancel для отмены");
  }
});

// Команда отмены
bot.command("cancel", (ctx) => {
  const pending = pendingReplies.get(ctx.chat.id.toString());
  if (pending) {
    pendingReplies.delete(ctx.chat.id.toString());
    ctx.reply("❌ Отправка сообщения отменена");
  } else {
    ctx.reply("Нет активной отправки сообщения");
  }
});
```

---

### Этап 5: Компоненты фронтенда (6-8 часов)

#### 5.1. Компонент мессенджера поддержки

**Файл:** `components/support/support-messenger.tsx`

```typescript
"use client";

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';
import { useSupportMessages } from '@/hooks/use-support-messages';
import { useTypingIndicator } from '@/hooks/use-typing-indicator';
import { useNotificationSound } from '@/hooks/use-notification-sound';

interface SupportMessengerProps {
  onClose?: () => void;
}

export function SupportMessenger({ onClose }: SupportMessengerProps) {
  const { address } = useAccount();
  const { messages, sendMessage, loading } = useSupportMessages(address);
  const { isTyping, adminUsername } = useTypingIndicator(address);
  const { playNotification } = useNotificationSound();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Воспроизведение звука при новом сообщении от админа
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.type === 'admin') {
      playNotification();
    }
  }, [messages, playNotification]);

  const handleSend = async (text: string) => {
    if (!text.trim() || !address) return;
    await sendMessage(text);
  };

  if (!address) {
    return (
      <div className="p-4 text-center text-gray-500">
        Подключите кошелек для общения с поддержкой
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Заголовок */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Техническая поддержка</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* Список сообщений */}
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
        {isTyping && <TypingIndicator adminUsername={adminUsername} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <MessageInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
```

#### 5.2. Хук для работы с сообщениями

**Файл:** `hooks/use-support-messages.ts`

```typescript
import { useState, useEffect, useCallback } from "react";

interface Message {
  id: string;
  type: "user" | "admin" | "system";
  text: string;
  adminUsername?: string;
  createdAt: string;
  isRead: boolean;
}

export function useSupportMessages(walletAddress?: `0x${string}`) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Загрузка сообщений
  const loadMessages = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(
        `/api/support/get-messages?walletAddress=${walletAddress}${sessionId ? `&sessionId=${sessionId}` : ""}`,
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, [walletAddress, sessionId]);

  // Отправка сообщения
  const sendMessage = useCallback(
    async (text: string) => {
      if (!walletAddress || !text.trim()) return;

      setLoading(true);
      try {
        const response = await fetch("/api/support/send-user-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            text,
            sessionId,
          }),
        });

        if (response.ok) {
          // Перезагрузить сообщения
          await loadMessages();
        }
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setLoading(false);
      }
    },
    [walletAddress, sessionId, loadMessages],
  );

  // Polling для новых сообщений
  useEffect(() => {
    if (!walletAddress) return;

    loadMessages();
    const interval = setInterval(loadMessages, 3000); // Каждые 3 секунды

    return () => clearInterval(interval);
  }, [walletAddress, loadMessages]);

  return {
    messages,
    sendMessage,
    loading,
    refresh: loadMessages,
  };
}
```

#### 5.3. Хук для статуса "печатает"

**Файл:** `hooks/use-typing-indicator.ts`

```typescript
import { useState, useEffect } from "react";

export function useTypingIndicator(walletAddress?: `0x${string}`) {
  const [isTyping, setIsTyping] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string>("Администратор");

  useEffect(() => {
    if (!walletAddress) return;

    const checkTyping = async () => {
      try {
        const response = await fetch(
          `/api/support/get-typing-status?walletAddress=${walletAddress}`,
        );
        if (response.ok) {
          const data = await response.json();
          setIsTyping(data.isTyping || false);
          if (data.adminUsername) {
            setAdminUsername(data.adminUsername);
          }
        }
      } catch (error) {
        console.error("Error checking typing status:", error);
      }
    };

    checkTyping();
    const interval = setInterval(checkTyping, 1000); // Проверка каждую секунду

    return () => clearInterval(interval);
  }, [walletAddress]);

  return { isTyping, adminUsername };
}
```

#### 5.4. Хук для звукового уведомления

**Файл:** `hooks/use-notification-sound.ts`

```typescript
import { useCallback, useRef } from "react";

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotification = useCallback(() => {
    try {
      // Создать audio элемент с звуком колокольчика
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/notification-bell.mp3");
        audioRef.current.volume = 0.5;
      }
      audioRef.current.play().catch((error) => {
        console.error("Error playing notification sound:", error);
      });
    } catch (error) {
      console.error("Error playing notification:", error);
    }
  }, []);

  return { playNotification };
}
```

---

### Этап 6: Интеграция с существующими компонентами (2-3 часа)

#### 6.1. Добавление модального окна в профиль

**Файл:** `components/profile/support-chat-modal.tsx`

```typescript
"use client";

import { useState } from 'react';
import { SupportMessenger } from '@/components/support/support-messenger';
import { Modal } from '@/components/ui/modal';

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportChatModal({ isOpen, onClose }: SupportChatModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Техническая поддержка">
      <SupportMessenger onClose={onClose} />
    </Modal>
  );
}
```

#### 6.2. Обновление EmailIcon для открытия чата

**Файл:** `components/layout/email-icon.tsx` (обновить)

```typescript
"use client";

import { useState } from 'react';
import { SupportChatModal } from '@/components/profile/support-chat-modal';

export function EmailIcon() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsChatOpen(true)}
        className="dark:bg-dark-surfaceAlt dark:text-dark-foreground dark:hover:bg-dark-surface flex h-8 w-8 items-center justify-center rounded-full bg-surfaceAlt text-foreground transition hover:bg-surface"
        aria-label="Open support chat"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </button>

      <SupportChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
```

---

### Этап 7: Добавление уведомлений о новых заявках (2-3 часа)

#### 7.1. Обновление API создания заявки на обмен

**Файл:** `app/api/submit-exchange-request/route.ts` (добавить)

```typescript
import { notifyNewExchangeRequest } from "@/lib/telegram/notify-admin";

// После успешного сохранения в БД:
await notifyNewExchangeRequest({
  id: requestId,
  walletAddress: data.walletAddress,
  email: data.email,
  tokenAmount: data.tokenAmount,
  fiatAmount: data.fiatAmount,
});
```

#### 7.2. Обновление API создания внутренней заявки

**Файл:** `app/api/submit-request/route.ts` (добавить)

```typescript
import { notifyNewInternalRequest } from "@/lib/telegram/notify-admin";

// После успешного сохранения в БД:
await notifyNewInternalRequest({
  id: requestId,
  requester: data.requester,
  walletAddress: data.walletAddress,
  department: data.department,
  requestType: data.requestType,
  priority: data.priority,
});
```

---

## 🎨 UI/UX требования

### Компонент чата

- **Дизайн:** Стиль как у существующего chat-window.tsx
- **Разметка сообщений:**
  - Сообщения пользователя: справа, синий цвет
  - Сообщения админа: слева, серый цвет
  - Показ имени админа для сообщений от админа
  - Timestamp для каждого сообщения

### Индикатор "печатает"

- Анимация из трех точек
- Текст: "{Имя админа} печатает..."
- Автоматическое исчезновение через 30 секунд

### Звуковое уведомление

- Звук: колокольчик (notification-bell.mp3)
- Громкость: 50%
- Воспроизведение только для непрочитанных сообщений от админа

---

## 🔒 Безопасность

### Проверки

1. **Валидация walletAddress:**
   - Формат: `0x[0-9a-fA-F]{40}`
   - Проверка на существование кошелька

2. **Аутентификация админа:**
   - Проверка `TELEGRAM_ADMIN_CHAT_ID` в переменных окружения
   - Валидация `adminId` при отправке сообщений

3. **Rate limiting:**
   - Ограничение количества сообщений: 10 в минуту на пользователя
   - Ограничение размера сообщения: 2000 символов

4. **Sanitization:**
   - Очистка HTML тегов из сообщений
   - Экранирование специальных символов

---

## 📝 Переменные окружения

Добавить в `.env.local`:

```env
# Telegram
TELEGRAM_API_KEY=your_telegram_bot_token
TELEGRAM_ADMIN_CHAT_ID=your_admin_chat_id
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram-webhook

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧪 Тестирование

### Чеклист тестирования

- [ ] Создание новой заявки отправляет уведомление в Telegram
- [ ] Кнопка "Отправить сообщение" открывает диалог отправки
- [ ] Сообщение от админа отображается на сайте
- [ ] Сообщение от пользователя приходит админу в Telegram
- [ ] Кнопка "История чата" показывает последние 10 сообщений
- [ ] Статус "печатает..." появляется и исчезает корректно
- [ ] Звук уведомления воспроизводится при новом сообщении
- [ ] Непрочитанные сообщения отмечаются корректно
- [ ] Модальное окно открывается при клике на иконку конверта
- [ ] Сообщения сохраняются в БД и загружаются корректно

---

## 📅 Временные оценки

| Этап      | Время       | Описание                 |
| --------- | ----------- | ------------------------ |
| Этап 1    | 1-2 ч       | Расширение БД            |
| Этап 2    | 2-3 ч       | Утилиты для Telegram     |
| Этап 3    | 4-5 ч       | API endpoints            |
| Этап 4    | 5-6 ч       | Расширение Telegram бота |
| Этап 5    | 6-8 ч       | Компоненты фронтенда     |
| Этап 6    | 2-3 ч       | Интеграция               |
| Этап 7    | 2-3 ч       | Уведомления о заявках    |
| **Итого** | **22-30 ч** | Полная реализация        |

---

## 🚀 План внедрения

### Фаза 1: Базовая функциональность (7-10 часов)

- Этап 1-3: БД + API endpoints
- Базовая отправка и получение сообщений

### Фаза 2: Telegram интеграция (7-10 часов)

- Этап 4: Расширение бота
- Уведомления о заявках
- Отправка сообщений из Telegram

### Фаза 3: UI и UX (8-13 часов)

- Этап 5-6: Компоненты фронтенда
- Статус "печатает..."
- Звуковые уведомления

---

## 📚 Дополнительные ресурсы

- [Telegraf Documentation](https://telegraf.js.org/)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

**Версия плана:** 1.0  
**Дата создания:** 2025-01-30  
**Статус:** Готов к реализации
