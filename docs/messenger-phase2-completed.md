# Фаза 2: Telegram интеграция - ЗАВЕРШЕНА ✅

## Что было реализовано

### Telegram Bot Handlers

**Файлы:**
- `app/api/telegram-webhook/route.ts` - Расширен с новыми обработчиками

**Добавленные callback handlers:**

#### 1. `msg_WALLET_ADDRESS` - Отправить сообщение
```typescript
bot.action(/^msg_(.+)$/, async (ctx) => {
  // Запускает диалог отправки сообщения пользователю
  // Сохраняет pending reply с типом 'support'
});
```

**Использование:**
Кнопка появляется в уведомлениях о новых заявках (exchange и internal requests)

**Пример:**
```
Admin получает уведомление:
🔔 Новая заявка на обмен токенов
💼 Кошелек: 0x1234...
📧 Email: user@example.com
[💬 Отправить сообщение] [📜 История чата]
```

#### 2. `history_WALLET_ADDRESS` - История чата
```typescript
bot.action(/^history_(.+)$/, async (ctx) => {
  // Запрашивает историю через GET /api/support/get-chat-history
  // Форматирует и отправляет в Telegram с кнопкой "Ответить"
});
```

**Особенности:**
- Показывает последние 10 сообщений
- Форматирует для Telegram с MarkdownV2
- Добавляет кнопку "Ответить" для быстрого ответа

**Формат вывода:**
```
📜 Последние 5 сообщений:

1. 👤 Пользователь
   Помогите с транзакцией...
   🕐 30.01.2025, 15:30

2. 👨‍💼 Support Admin
   Здравствуйте! Какая проблема?
   🕐 30.01.2025, 15:32

[💬 Ответить]
```

#### 3. `reply_WALLET_ADDRESS` - Ответить на сообщение
```typescript
bot.action(/^reply_(.+)$/, async (ctx) => {
  // Активирует режим ответа
  // Следующее текстовое сообщение будет отправлено пользователю
});
```

**Использование:**
- Кнопка после истории чата
- Следующее сообщение админа автоматически отправляется пользователю

### Система Pending Replies

**Расширена структура:**
```typescript
interface PendingReply {
  walletAddress: string;
  sessionId?: string;
  type: 'support' | 'chatbot';
}
```

**Как работает:**
1. Admin нажимает кнопку (msg_, reply_, history_)
2. Система сохраняет контекст в `pendingReplies` Map
3. Следующее текстовое сообщение обрабатывается согласно типу
4. После отправки контекст очищается

### Text Message Handler

Обновлен для обработки двух типов сообщений:

#### Support Messages (`type: 'support'`)
```typescript
if (pending.type === 'support') {
  // 1. Set typing indicator
  await setTyping(walletAddress, true);

  // 2. Wait 1.5 seconds (simulate typing)

  // 3. Send message via POST /api/support/send-admin-message

  // 4. Clear typing indicator (done автоматически API)

  // 5. Confirm to admin
  ctx.reply("✅ Сообщение отправлено пользователю");
}
```

#### Chatbot Messages (`type: 'chatbot'`)
```typescript
if (pending.type === 'chatbot') {
  // Send via POST /api/chatbot/admin-response
  // (существующая логика сохранена)
}
```

### Typing Indicator

**Реализация:**
- При отправке сообщения админом вызывается `/api/support/set-typing`
- Indicator живет 30 секунд (автоматическая очистка в БД)
- Задержка 1.5 сек перед отправкой для реалистичности

**Sequence:**
```
Admin начинает печатать
  ↓
POST /api/support/set-typing (isTyping: true)
  ↓
Wait 1500ms
  ↓
POST /api/support/send-admin-message
  ↓
Typing indicator cleared automatically
```

### Команда /cancel

```typescript
bot.command('cancel', (ctx) => {
  // Удаляет pending reply
  // Очищает typing timeout
  // Подтверждает отмену
});
```

**Использование:**
```
Admin: /cancel
Bot: ❌ Отправка сообщения отменена
```

### Интеграция с Requests

#### Exchange Requests (`submit-exchange-request/route.ts`)

**Добавлено:**
```typescript
import { notifyNewExchangeRequest } from '@/lib/telegram/notify-admin';

// After saving to DB
await notifyNewExchangeRequest({
  id: requestId,
  walletAddress: data.walletAddress,
  email: data.email,
  tokenAmount: data.tokenAmount,
  fiatAmount: data.fiatAmount,
});
```

**Результат:**
Admin получает уведомление с кнопками:
- 💬 Отправить сообщение
- 📜 История чата

#### Internal Requests (`submit-request/route.ts`)

**Добавлено:**
```typescript
import { notifyNewInternalRequest } from '@/lib/telegram/notify-admin';

// After saving to DB
await notifyNewInternalRequest({
  id: requestId,
  requester: data.requester,
  walletAddress: data.walletAddress,
  department: departmentMap[data.department],
  requestType: requestTypeMap[data.requestType],
  priority: data.priority.toUpperCase(),
});
```

**Результат:**
Аналогично exchange requests - уведомление с кнопками поддержки.

## Изменённые файлы

```
app/api/
├── telegram-webhook/route.ts          (+200 строк)
│   ├── PendingReply interface
│   ├── Support callback handlers (msg_, history_, reply_)
│   ├── /cancel command
│   ├── Updated text handler
│   └── Typing indicator logic
│
├── submit-exchange-request/route.ts   (+10 строк)
│   └── notifyNewExchangeRequest() call
│
└── submit-request/route.ts            (+12 строк)
    └── notifyNewInternalRequest() call
```

## Потоки данных

### Поток 1: Новая заявка → Уведомление → Ответ

```
User submits exchange request
    ↓
POST /api/submit-exchange-request
    ↓
Save to DB
    ↓
notifyNewExchangeRequest()
    ↓
Telegram notification with buttons:
  [💬 Отправить сообщение] [📜 История чата]
    ↓
Admin clicks "💬 Отправить сообщение"
    ↓
bot.action(/^msg_(.+)$/) triggered
    ↓
pendingReplies.set(chatId, { walletAddress, type: 'support' })
    ↓
Admin types message
    ↓
bot.on("text") handler detects pending reply
    ↓
POST /api/support/set-typing (isTyping: true)
    ↓
Wait 1.5 seconds
    ↓
POST /api/support/send-admin-message
    ↓
Message saved to DB, typing cleared
    ↓
User sees message on website (via polling)
```

### Поток 2: Просмотр истории → Ответ

```
Admin clicks "📜 История чата"
    ↓
bot.action(/^history_(.+)$/) triggered
    ↓
GET /api/support/get-chat-history
    ↓
Format & send to Telegram with button:
  [💬 Ответить]
    ↓
Admin clicks "💬 Ответить"
    ↓
bot.action(/^reply_(.+)$/) triggered
    ↓
pendingReplies.set(chatId, { walletAddress, type: 'support' })
    ↓
Admin types message
    ↓
... (same as Flow 1)
```

### Поток 3: Отмена отправки

```
Admin clicks "💬 Отправить сообщение"
    ↓
pending reply saved
    ↓
Admin decides to cancel
    ↓
/cancel command
    ↓
pendingReplies.delete(chatId)
    ↓
typing timeout cleared
    ↓
"❌ Отправка сообщения отменена"
```

## Тестирование

### Manual Testing

#### Test 1: Submit exchange request
```bash
# 1. Submit exchange request through website
curl -X POST http://localhost:3000/api/submit-exchange-request \
  -H "Content-Type: application/json" \
  -d '{
    "tokenAmount": "1000",
    "fiatAmount": "1500",
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "email": "test@example.com",
    "rate": "1.5",
    "commission": "2"
  }'

# 2. Check Telegram for notification with buttons
# 3. Click "💬 Отправить сообщение"
# 4. Type a message
# 5. Verify delivery
```

#### Test 2: View history
```bash
# 1. Have some existing messages
# 2. Click "📜 История чата" button
# 3. Verify history format
# 4. Click "💬 Ответить"
# 5. Send reply
```

#### Test 3: Cancel
```bash
# 1. Click "💬 Отправить сообщение"
# 2. Type /cancel
# 3. Verify cancellation message
# 4. Try typing again (should not send as support message)
```

## Known Issues & Limitations

### 1. In-Memory Storage
**Issue:** `pendingReplies` and `typingTimeouts` Maps are in-memory
**Impact:** Lost on server restart
**Solution:** Use Redis or database for production

### 2. No Multi-Admin Support
**Issue:** Only one TELEGRAM_ADMIN_CHAT_ID
**Impact:** All notifications go to one chat
**Solution:** Support multiple admin IDs or Telegram groups

### 3. Callback Collision
**Issue:** `reply_` pattern could conflict with other uses
**Impact:** May catch unintended callbacks
**Solution:** Use more specific pattern like `support_reply_`

### 4. Rate Limiting
**Issue:** No rate limiting on Telegram bot actions
**Impact:** Could be spammed
**Solution:** Add rate limiting per admin

## Environment Variables

Required (должны быть уже настроены):
```env
TELEGRAM_API_KEY=bot_token
TELEGRAM_ADMIN_CHAT_ID=admin_chat_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security

### Implemented:
- ✅ Wallet address validation in API endpoints
- ✅ Admin ID tracking in messages
- ✅ Error handling for failed notifications
- ✅ Non-blocking notifications (don't fail main flow)

### TODO:
- ⏳ Verify admin permissions (check TELEGRAM_ADMIN_CHAT_ID)
- ⏳ Rate limiting for bot commands
- ⏳ Encrypt sensitive data in pendingReplies

## Performance

### Optimizations:
- Non-blocking notifications (fire-and-forget with catch)
- Minimal Telegram API calls (only when needed)
- Efficient history formatting

### Monitoring:
```typescript
// Log all bot actions
console.log('[telegram-webhook] Action:', {
  type,
  walletAddress,
  adminId
});
```

## Next Steps

### Phase 3: Frontend UI (8-13 hours)

**Planned:**
- React components for chat interface
- Hooks for API integration (`use-support-messages.ts`)
- Modal window for chat
- Polling implementation (3-second intervals)
- Sound notifications
- Typing indicator UI

**Files to create:**
```
components/support/
├── support-messenger.tsx
├── message-list.tsx
├── message-item.tsx
├── message-input.tsx
├── typing-indicator.tsx
└── notification-sound.tsx

hooks/
├── use-support-messages.ts
├── use-typing-indicator.ts
└── use-notification-sound.ts
```

## Changelog

### Added
- 3 новых callback handlers (msg_, history_, reply_)
- Команда /cancel
- Support type в pending replies
- Typing indicator при отправке
- Интеграция в submit-exchange-request
- Интеграция в submit-request

### Modified
- PendingReply interface (добавлен type)
- Text handler (support vs chatbot routing)
- reply_to_chat_ handler (использует новую структуру)

### Fixed
- N/A (новая функциональность)

## Version

- **Дата завершения:** 2025-01-30
- **Версия:** 2.0.0
- **Статус:** ✅ Готово к тестированию
- **Зависимости:** Phase 1 APIs

---

**Следующая фаза:** Frontend UI (Phase 3)
