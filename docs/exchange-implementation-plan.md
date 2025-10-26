# План реализации обменника с Telegram-ботом

## 📋 Обзор проекта

**Цель:** Реализовать полнофункциональный обменник токенов в фиат с интеграцией Telegram-бота для обработки заявок.

**Стек:** Next.js 16, TypeScript, Telegram Bot API (telegraf), Resend для email, TailwindCSS

**Общее время:** 3-4 часа

---

## 🎯 Архитектура решения

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API    │────▶│  Telegram Bot   │
│  (Calculator)   │     │   (Next.js)      │     │  (Notifications)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                          │
                                ▼                          ▼
                         ┌──────────────┐         ┌──────────────┐
                         │   Database   │         │  Manager     │
                         │  (optional)  │         │  (Telegram)  │
                         └──────────────┘         └──────────────┘
```

---

## 📅 Фаза 1: Подготовка и настройка (30 минут)

### 1.1 Создание Telegram-бота

1. **Откройте [@BotFather](https://t.me/BotFather) в Telegram**
2. Отправьте команду `/newbot`
3. Следуйте инструкциям:
   - Укажите имя бота (например: `EuroCoin Exchange Bot`)
   - Укажите username (например: `eurocoin_exchange_bot`)
4. **Сохраните полученный токен** (формат: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 1.2 Установка зависимостей

```bash
pnpm add telegraf
```

### 1.3 Настройка переменных окружения

Добавьте в `.env.local`:

```env
# Telegram Bot Configuration
TELEGRAM_API_KEY=your_bot_token_from_botfather
TELEGRAM_MANAGER_CHAT_ID=your_manager_telegram_chat_id

# Exchange Configuration
NEXT_PUBLIC_EXCHANGE_RATE_RUB_PER_TOKEN=150
NEXT_PUBLIC_EXCHANGE_COMMISSION_PERCENT=1.5
NEXT_PUBLIC_AVERAGE_PROCESSING_TIME_MINUTES=15

# Email Configuration (already configured)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
SENDER_EMAIL=noreply@resend.dev
RECIPIENT_EMAIL=treasury@company.io
```

**Примечания:**

- `TELEGRAM_MANAGER_CHAT_ID` можно узнать, написав боту [@userinfobot](https://t.me/userinfobot)
- Для группы используйте `@my_id_bot` для получения group chat ID

---

## 📅 Фаза 2: Backend - Telegram Bot API (1 час)

### 2.1 Создание API Route для Telegram Webhook

**Файл:** `app/api/telegram-webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Store for demo (in production, use database)
const exchangeRequests = new Map<string, any>();

bot.start((ctx) => {
  const chatId = ctx.chat.id;
  const username = ctx.chat.first_name || "User";

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

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: "Telegram webhook is active" });
}
```

### 2.2 Создание API Route для отправки заявок на обмен

**Файл:** `app/api/submit-exchange-request/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";
import { Resend } from "resend";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const resend = new Resend(process.env.RESEND_API_KEY);

interface ExchangeRequest {
  tokenAmount: string;
  fiatAmount: string;
  walletAddress: string;
  email: string;
  commission: string;
  rate: string;
  comment?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ExchangeRequest = await request.json();

    // Validate required fields
    if (!data.tokenAmount || !data.fiatAmount || !data.walletAddress || !data.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate request ID
    const requestId = `EX-${Date.now()}`;

    // Prepare message for manager
    const message = `
🔔 *Новая заявка на обмен токенов*

📋 *ID заявки:* ${requestId}
💰 *Сумма токенов:* ${data.tokenAmount} TOKEN
💵 *Сумма фиата:* ${data.fiatAmount} RUB
📊 *Курс:* ${data.rate} RUB за 1 TOKEN
💸 *Комиссия:* ${data.commission}%

💼 *Адрес кошелька:*
\`${data.walletAddress}\`

📧 *Email клиента:* ${data.email}
${data.comment ? `📝 *Комментарий:* ${data.comment}` : ""}

⏰ *Время:* ${new Date().toLocaleString("ru-RU")}
`;

    // Send to manager in Telegram
    const managerChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
    if (managerChatId) {
      await bot.telegram.sendMessage(managerChatId, message, { parse_mode: "Markdown" });
    }

    // Send email notification
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #667eea; display: block; margin-bottom: 5px; }
            .value { padding: 10px; background: white; border-radius: 4px; border-left: 3px solid #667eea; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🔔 Новая заявка на обмен токенов</h2>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">ID заявки:</span>
                <div class="value">${requestId}</div>
              </div>
              <div class="field">
                <span class="label">Сумма токенов:</span>
                <div class="value">${data.tokenAmount} TOKEN</div>
              </div>
              <div class="field">
                <span class="label">Сумма фиата:</span>
                <div class="value">${data.fiatAmount} RUB</div>
              </div>
              <div class="field">
                <span class="label">Курс:</span>
                <div class="value">${data.rate} RUB за 1 TOKEN</div>
              </div>
              <div class="field">
                <span class="label">Комиссия:</span>
                <div class="value">${data.commission}</div>
              </div>
              <div class="field">
                <span class="label">Адрес кошелька:</span>
                <div class="value">${data.walletAddress}</div>
              </div>
              <div class="field">
                <span class="label">Email клиента:</span>
                <div class="value">${data.email}</div>
              </div>
              ${
                data.comment
                  ? `
              <div class="field">
                <span class="label">Комментарий:</span>
                <div class="value">${data.comment}</div>
              </div>
              `
                  : ""
              }
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">
                Время: ${new Date().toLocaleString("ru-RU")}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: process.env.SENDER_EMAIL!,
      to: process.env.RECIPIENT_EMAIL!,
      subject: `[EXCHANGE] Новая заявка ${requestId}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, requestId }, { status: 200 });
  } catch (error) {
    console.error("Error processing exchange request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## 📅 Фаза 3: Frontend - Обновление калькулятора (30 минут)

### 3.1 Обновление `ExchangeSection` компонента

**Файл:** `components/exchange/exchange-section.tsx`

**Изменения:**

1. **Добавьте state для формы заявки:**

```typescript
const [formData, setFormData] = useState({
  walletAddress: "",
  email: "",
  comment: "",
});
const [isSubmitting, setIsSubmitting] = useState(false);
```

2. **Обновите функцию `copyTemplate`:**

```typescript
const copyTemplate = () => {
  const template = `Заявка на обмен токенов:
Сумма: ${tokenAmount} TOKEN
Получить: ~${rubAmount} RUB
Курс: 150 RUB за 1 TOKEN
Комиссия: 1.5%
Адрес кошелька: ${formData.walletAddress || "не указан"}
Email: ${formData.email || "не указан"}`;

  navigator.clipboard.writeText(template).then(() => {
    toast.success("Шаблон скопирован!");
  });
};
```

3. **Добавьте функцию отправки заявки:**

```typescript
const handleSubmitRequest = async () => {
  // Validate
  if (!formData.walletAddress || !formData.email) {
    toast.error("Заполните все обязательные поля!");
    return;
  }

  setIsSubmitting(true);

  try {
    const response = await fetch("/api/submit-exchange-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tokenAmount,
        fiatAmount: rubAmount,
        walletAddress: formData.walletAddress,
        email: formData.email,
        comment: formData.comment,
        commission: "1.5%",
        rate: "150 RUB за 1 TOKEN",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit request");
    }

    toast.success("Заявка успешно отправлена в Telegram!");

    // Reset form
    setFormData({
      walletAddress: "",
      email: "",
      comment: "",
    });
  } catch (error) {
    console.error("Error submitting exchange request:", error);
    toast.error("Ошибка при отправке заявки. Попробуйте еще раз.");
  } finally {
    setIsSubmitting(false);
  }
};
```

4. **Добавьте поля формы в JSX:**

```typescript
{/* Form Fields */}
<div className="space-y-4">
  {/* Existing token amount input */}

  {/* Wallet Address */}
  <div>
    <label className="mb-2 block text-sm font-medium">
      Адрес кошелька для получения фиата *
    </label>
    <input
      type="text"
      value={formData.walletAddress}
      onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
      className="w-full rounded-lg border border-outline bg-surface px-4 py-3"
      placeholder="Введите адрес кошелька"
      required
    />
  </div>

  {/* Email */}
  <div>
    <label className="mb-2 block text-sm font-medium">
      Email для связи *
    </label>
    <input
      type="email"
      value={formData.email}
      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      className="w-full rounded-lg border border-outline bg-surface px-4 py-3"
      placeholder="your@email.com"
      required
    />
  </div>

  {/* Comment (optional) */}
  <div>
    <label className="mb-2 block text-sm font-medium">
      Комментарий (необязательно)
    </label>
    <textarea
      value={formData.comment}
      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
      className="w-full rounded-lg border border-outline bg-surface px-4 py-3"
      placeholder="Дополнительная информация"
      rows={3}
    />
  </div>
</div>
```

5. **Обновите кнопку:**

```typescript
<Button
  onClick={handleSubmitRequest}
  disabled={isSubmitting}
  className="flex-1 bg-accent text-white hover:bg-accent/90"
>
  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
  {isSubmitting ? "Отправка..." : "Создать заявку в Telegram"}
</Button>
```

6. **Добавьте импорты:**

```typescript
import toast from "react-hot-toast";
```

---

## 📅 Фаза 4: Настройка Webhook для Telegram (15 минут)

### 4.1 Получение Public URL для разработки

**Для локальной разработки используйте ngrok:**

1. Установите ngrok: `brew install ngrok` (macOS) или скачайте с [ngrok.com](https://ngrok.com)
2. Запустите: `ngrok http 3000`
3. Скопируйте HTTPS URL (например: `https://abc123.ngrok.io`)

### 4.2 Установка Webhook

Откройте в браузере:

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://abc123.ngrok.io/api/telegram-webhook
```

**Или используйте curl:**

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://abc123.ngrok.io/api/telegram-webhook"
```

### 4.3 Проверка Webhook

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

---

## 📅 Фаза 5: Тестирование (30 минут)

### 5.1 Тестирование калькулятора

1. Запустите dev сервер: `pnpm dev`
2. Откройте страницу с обменником
3. Введите сумму в токенах
4. Проверьте, что сумма в RUB пересчитывается с учетом комиссии

### 5.2 Тестирование отправки заявки

1. Заполните форму заявки:
   - Введите сумму токенов
   - Введите адрес кошелька
   - Введите email
   - (Опционально) Добавьте комментарий
2. Нажмите "Создать заявку в Telegram"
3. Проверьте, что:
   - ✅ Появился toast с успешным сообщением
   - ✅ Форма очистилась
   - ✅ В Telegram менеджеру пришло уведомление
   - ✅ На email пришло уведомление

### 5.3 Тестирование бота

1. Найдите вашего бота в Telegram по username
2. Отправьте команду `/start`
3. Проверьте, что бот ответил с приветствием

---

## 📅 Фаза 6: Продакшен (опционально)

### 6.1 Деплой на Vercel

```bash
pnpm build
vercel --prod
```

### 6.2 Установка webhook для продакшн

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram-webhook"
```

### 6.3 Мониторинг

- Проверьте логи в Vercel Dashboard
- Настройте алерты для ошибок
- Добавьте аналитику (опционально)

---

## ✅ Чеклист реализации

### Backend

- [ ] Создан Telegram-бот через BotFather
- [ ] Установлена библиотека `telegraf`
- [ ] Создан API route `/api/telegram-webhook`
- [ ] Создан API route `/api/submit-exchange-request`
- [ ] Настроены переменные окружения
- [ ] Добавлена отправка уведомлений в Telegram
- [ ] Добавлена отправка email через Resend

### Frontend

- [ ] Калькулятор работает динамически
- [ ] Добавлены поля формы (адрес, email, комментарий)
- [ ] Валидация формы работает
- [ ] Кнопка отправки заявки работает
- [ ] Добавлены toast-уведомления
- [ ] Очистка формы после успешной отправки

### Telegram Bot

- [ ] Webhook настроен и работает
- [ ] Бот отвечает на команду `/start`
- [ ] Уведомления доставляются менеджеру
- [ ] Форматирование сообщений корректное

### Тестирование

- [ ] Калькулятор считает правильно
- [ ] Заявка отправляется без ошибок
- [ ] Менеджер получает уведомление
- [ ] Email доставляется
- [ ] Обработка ошибок работает

---

## 🔧 Troubleshooting

### Проблема: Webhook не работает

**Решение:** Проверьте, что URL правильный и HTTPS

### Проблема: Менеджер не получает уведомления

**Решение:** Проверьте `TELEGRAM_MANAGER_CHAT_ID` в `.env.local`

### Проблема: Email не отправляется

**Решение:** Проверьте `RESEND_API_KEY` и `RECIPIENT_EMAIL`

### Проблема: Ошибка при отправке заявки

**Решение:** Проверьте консоль браузера и логи сервера

---

## 📝 Дополнительные улучшения (опционально)

### База данных

- Добавьте PostgreSQL для хранения заявок
- Добавьте историю обменов
- Добавьте статистику

### Расширенные функции бота

- Добавьте команды менеджера (`/accept`, `/cancel`, `/complete`)
- Добавьте инлайн-кнопки для быстрого управления
- Добавьте уведомления клиенту о статусе заявки

### Аналитика

- Добавьте отслеживание конверсии
- Добавьте метрики времени обработки
- Добавьте отчеты

---

**Время реализации:** 3-4 часа  
**Сложность:** Средняя  
**Приоритет:** Высокий
