# Фаза 1: Базовая функциональность мессенджера - ЗАВЕРШЕНА ✅

## Что было реализовано

### 1. База данных (Этап 1)

**Файлы:**
- `lib/database/migrations/add-support-messenger.sql` - SQL миграция
- `lib/database/support-queries.ts` - Типизированные запросы

**Создано:**
- Таблица `support_messages` - хранение сообщений поддержки
- Таблица `typing_indicators` - индикаторы "печатает..."
- Расширение `chatbot_sessions` - добавлены поля `last_admin_message_at` и `unread_count`
- SQL функции для очистки и статистики
- Триггеры для автоматического обновления счетчиков

### 2. Telegram утилиты (Этап 2)

**Файлы:**
- `lib/telegram/notify-admin.ts`

**Функции:**
- `notifyNewExchangeRequest()` - уведомление о заявке на обмен
- `notifyNewInternalRequest()` - уведомление о внутренней заявке
- `notifyAdminNewMessage()` - уведомление о новом сообщении от пользователя
- `formatChatHistoryForTelegram()` - форматирование истории чата
- `sanitizeMessageText()` - очистка текста сообщений
- `isValidWalletAddress()` - валидация адреса кошелька

### 3. API Endpoints (Этап 3)

Все endpoints находятся в `app/api/support/`:

#### 3.1. POST `/api/support/send-user-message`
Отправка сообщения пользователем в поддержку

**Параметры:**
```json
{
  "walletAddress": "0x...",
  "text": "Текст сообщения",
  "sessionId": "uuid" // опционально
}
```

**Возвращает:**
```json
{
  "success": true,
  "message": {
    "id": "uuid",
    "type": "user",
    "text": "...",
    "created_at": "2025-01-30T...",
    "is_read": false
  },
  "sessionId": "uuid"
}
```

**Особенности:**
- Rate limiting: 10 сообщений в минуту
- Максимальная длина: 2000 символов
- Автоматическая санитизация текста
- Отправка уведомления админу в Telegram

#### 3.2. POST `/api/support/send-admin-message`
Отправка сообщения админом пользователю

**Параметры:**
```json
{
  "walletAddress": "0x...",
  "text": "Текст ответа",
  "adminId": 123456789,
  "adminUsername": "Admin Name",
  "sessionId": "uuid" // опционально
}
```

**Особенности:**
- Автоматическое удаление индикатора "печатает"
- Обновление метаданных сессии
- Валидация существования сессии

#### 3.3. GET `/api/support/get-messages`
Получение сообщений для пользователя

**Query параметры:**
- `walletAddress` (обязательно)
- `sessionId` (опционально)
- `limit` (опционально, по умолчанию 100)

**Возвращает:**
```json
{
  "messages": [...],
  "sessionId": "uuid"
}
```

**Особенности:**
- Автоматическая отметка сообщений как прочитанных
- Сброс счетчика непрочитанных
- Сортировка по времени создания

#### 3.4. GET `/api/support/get-chat-history`
Получение истории чата (для Telegram)

**Query параметры:**
- `walletAddress` (обязательно)
- `limit` (опционально, по умолчанию 10, максимум 50)

**Возвращает:**
```json
{
  "messages": [...],
  "count": 10
}
```

#### 3.5. POST `/api/support/set-typing`
Установка статуса "печатает"

**Параметры:**
```json
{
  "walletAddress": "0x...",
  "adminId": 123456789,
  "adminUsername": "Admin",
  "isTyping": true
}
```

**Особенности:**
- Автоматическая очистка старых индикаторов
- Время жизни: 30 секунд
- Удаление при `isTyping: false`

#### 3.6. GET `/api/support/get-typing-status`
Получение статуса "печатает"

**Query параметры:**
- `walletAddress` (обязательно)

**Возвращает:**
```json
{
  "isTyping": true,
  "adminUsername": "Admin Name",
  "startedAt": "2025-01-30T..."
}
```

## Как применить изменения

### Шаг 1: Применение миграции базы данных

```bash
# Подключитесь к вашей PostgreSQL базе данных
psql $DATABASE_URL

# Выполните миграцию
\i lib/database/migrations/add-support-messenger.sql

# Проверьте, что таблицы созданы
\dt support_messages
\dt typing_indicators
\d chatbot_sessions
```

Или через Node.js:

```javascript
const { query } = require('./lib/database/db');
const fs = require('fs');

const migration = fs.readFileSync(
  './lib/database/migrations/add-support-messenger.sql',
  'utf8'
);

await query(migration);
```

### Шаг 2: Настройка переменных окружения

Добавьте в `.env.local`:

```env
# Telegram Bot Configuration
TELEGRAM_API_KEY=your_bot_token_here
TELEGRAM_ADMIN_CHAT_ID=your_admin_chat_id

# Optional: Your app URL for webhooks
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Шаг 3: Проверка работоспособности

```bash
# Запустите dev сервер
npm run dev

# Проверьте endpoints
curl http://localhost:3000/api/support/get-messages?walletAddress=0x...
```

## Безопасность

Реализованные меры:
- ✅ Валидация wallet address формата
- ✅ Rate limiting для пользовательских сообщений (10/мин)
- ✅ Санитизация HTML в сообщениях
- ✅ Ограничение длины сообщений (2000 символов)
- ✅ SQL injection защита (параметризованные запросы)
- ✅ Type safety через TypeScript

## Следующие шаги

### Фаза 2: Telegram интеграция (7-10 часов)
- Расширение Telegram бота для обработки callback кнопок
- Реализация отправки сообщений из Telegram
- Обработка команды `/cancel`
- Интеграция с существующими уведомлениями о заявках

### Фаза 3: UI/UX (8-13 часов)
- Компоненты фронтенда (чат, сообщения, индикаторы)
- React hooks для работы с API
- Модальное окно чата
- Звуковые уведомления
- Polling для обновлений (или SSE/WebSocket)

## Тестирование

### Unit тесты для API

```bash
# TODO: Добавить тесты
npm test -- support
```

### Ручное тестирование

1. **Создание сообщения пользователем:**
```bash
curl -X POST http://localhost:3000/api/support/send-user-message \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "text": "Привет, у меня вопрос"
  }'
```

2. **Получение сообщений:**
```bash
curl "http://localhost:3000/api/support/get-messages?walletAddress=0x1234567890123456789012345678901234567890"
```

3. **Отправка ответа админом:**
```bash
curl -X POST http://localhost:3000/api/support/send-admin-message \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "text": "Здравствуйте! Чем могу помочь?",
    "adminId": 123456789,
    "adminUsername": "Support Admin"
  }'
```

## Известные ограничения

1. **Rate limiting** - хранится в памяти, сбрасывается при перезапуске
   - *Решение:* Использовать Redis в production
2. **Polling** вместо WebSocket/SSE для real-time обновлений
   - *Решение:* Добавить в Фазе 3
3. **Уникальный constraint** на `chatbot_sessions.user_wallet_address` должен быть добавлен:
   ```sql
   ALTER TABLE chatbot_sessions ADD CONSTRAINT unique_wallet_address UNIQUE (user_wallet_address);
   ```

## Производительность

### Рекомендации:
- Индексы созданы для всех частых запросов
- Cleanup функция для typing_indicators должна вызываться периодически
- Limit по умолчанию 100 сообщений для get-messages

### Мониторинг:
```sql
-- Статистика сообщений
SELECT type, COUNT(*), AVG(LENGTH(text)) as avg_length
FROM support_messages
GROUP BY type;

-- Активные индикаторы печатания
SELECT COUNT(*) FROM typing_indicators WHERE expires_at > NOW();
```

## Заметки для разработчиков

1. Все SQL запросы типизированы через TypeScript интерфейсы
2. Error handling реализован на всех уровнях
3. Логирование через `console.error` (можно заменить на winston/pino)
4. Telegram уведомления не блокируют основной поток (fire-and-forget)

## Версия

- **Дата завершения:** 2025-01-30
- **Версия:** 1.0.0
- **Статус:** ✅ Готово к тестированию
