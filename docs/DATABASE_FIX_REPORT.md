# Отчет об исправлении проблемы с базой данных

## Дата: 2025-11-11

---

## 🐛 Проблема

При попытке подписки на рассылку появлялись ошибки:
- ❌ "Failed to send code" (3 раза)
- ❌ HTTP 403 статусы на все запросы к `/api/newsletter/send-code`
- ❌ В консоли: `database "web_wallet_db" does not exist`

### Скриншот ошибки:
В логах сервера:
```
error: database "web_wallet_db" does not exist
FATAL: 3D000
```

---

## 🔍 Анализ

### Что проверили:

1. **API Endpoints** ✅
   - `/api/newsletter/send-code/route.ts` - код правильный
   - `/api/newsletter/verify-code/route.ts` - код правильный

2. **Компонент NewsletterModal** ✅
   - Компонент работает корректно
   - Отправляет правильные запросы

3. **Middleware** ✅
   - Middleware не блокирует API routes
   - Исключение настроено правильно: `"/((?!api|...).*)`

4. **База данных** ❌
   - База данных `web_wallet_db` НЕ существовала!
   - Это критическая проблема

### Вывод:
Все API endpoints, которые обращались к базе данных, падали с ошибкой "database does not exist", что приводило к HTTP 500/403 ответам.

---

## ✅ Решение

### Шаг 1: Создание базы данных

```bash
psql -U postgres -c "CREATE DATABASE web_wallet_db;"
```

**Результат:** `CREATE DATABASE` ✅

---

### Шаг 2: Применение SQL схем

Применены все схемы в следующем порядке:

#### 2.1. Основная схема (`schema.sql`)
```bash
psql -U postgres -d web_wallet_db -f lib/database/schema.sql
```

**Таблицы созданы:**
- `exchange_requests` - заявки на обмен
- `internal_requests` - внутренние заявки
- Индексы и триггеры

---

#### 2.2. Newsletter схема (`newsletter-schema.sql`)
```bash
psql -U postgres -d web_wallet_db -f lib/database/newsletter-schema.sql
```

**Таблицы созданы:**
- `newsletter_subscribers` - подписчики рассылки
  - `id` (SERIAL PRIMARY KEY)
  - `email` (VARCHAR(255) UNIQUE)
  - `chat_id` (VARCHAR(255)) - для Telegram
  - `verified` (BOOLEAN) - email подтвержден
  - `verification_code` (VARCHAR(6)) - код подтверждения
  - `code_expires_at` (TIMESTAMP) - срок действия кода
  - `subscribed_at` (TIMESTAMP)
  - `is_active` (BOOLEAN) - статус подписки
  - `language` (VARCHAR(10)) - язык (ru/en/all)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

- `newsletter_campaigns` - история рассылок
- `newsletter_logs` - логи отправки

**Индексы созданы:**
- `idx_newsletter_email`
- `idx_newsletter_chat_id`
- `idx_newsletter_is_active`
- `idx_newsletter_verified`
- `idx_newsletter_language`

---

#### 2.3. Chatbot схема (`chatbot-schema.sql`)
```bash
psql -U postgres -d web_wallet_db -f lib/database/chatbot-schema.sql
```

**Таблицы созданы:**
- `chatbot_sessions` - сессии чатбота
- `chatbot_messages` - сообщения
- `chatbot_transaction_analysis` - анализ транзакций

---

#### 2.4. Auth схема (`auth-schema.sql`)
```bash
psql -U postgres -d web_wallet_db -f lib/database/auth-schema.sql
```

**Таблицы созданы:**
- `users` - пользователи
- `accounts` - OAuth аккаунты
- `sessions` - сессии NextAuth
- `verification_tokens` - токены верификации
- `typing_indicators` - индикаторы печати

---

## 📊 Проверка

### Список таблиц newsletter:
```sql
\dt newsletter*
```

**Результат:**
```
 newsletter_campaigns   | table | postgres
 newsletter_logs        | table | postgres
 newsletter_subscribers | table | postgres
```
✅ Все таблицы на месте!

---

### Схема таблицы newsletter_subscribers:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'newsletter_subscribers';
```

**Результат:** 11 колонок ✅
- id, email, chat_id, verified, verification_code, code_expires_at
- subscribed_at, is_active, language, created_at, updated_at

---

## 🚀 Следующие шаги

### 1. Перезапустить dev сервер
```bash
# Убить процесс на порту 3000
lsof -ti:3000 | xargs kill -9

# Запустить заново
npm run dev
```

### 2. Протестировать подписку
1. Открыть сайт
2. Кликнуть "Подписаться на рассылку"
3. Ввести email
4. Нажать "Отправить код"
5. ✅ Должно работать!

### 3. Проверить email конфигурацию

Убедитесь, что в `.env.local` настроены:
```bash
EMAIL_USER=support@euro-coin.eu
EMAIL_PASSWORD=your_app_password_here
```

**Примечание:** Для Gmail нужен App Password, а не обычный пароль!

Как создать App Password:
1. Перейти в Google Account → Security
2. Включить 2FA (если еще не включено)
3. Перейти в "App passwords"
4. Создать пароль для "Mail"
5. Использовать этот пароль в `EMAIL_PASSWORD`

---

## 📝 Итоговый чек-лист

### База данных:
- [x] База `web_wallet_db` создана
- [x] Схема `schema.sql` применена
- [x] Схема `newsletter-schema.sql` применена
- [x] Схема `chatbot-schema.sql` применена
- [x] Схема `auth-schema.sql` применена
- [x] Все таблицы проверены

### Конфигурация:
- [x] `DATABASE_URL` в `.env.local` корректный
- [ ] `EMAIL_USER` настроен (проверить)
- [ ] `EMAIL_PASSWORD` настроен (проверить)

### Следующий шаг:
- [ ] Перезапустить dev сервер
- [ ] Протестировать подписку на рассылку
- [ ] Проверить отправку email

---

## 🎯 Ожидаемый результат

После выполнения всех шагов:
1. ✅ API `/api/newsletter/send-code` работает
2. ✅ Email с кодом отправляется
3. ✅ Подписка сохраняется в БД
4. ✅ Верификация кода работает
5. ✅ Пользователь может подписаться на рассылку

---

## 📞 Устранение проблем

### Если ошибка "Failed to send email":
1. Проверьте `EMAIL_USER` и `EMAIL_PASSWORD` в `.env.local`
2. Для Gmail используйте App Password
3. Убедитесь, что 2FA включена в Google аккаунте

### Если ошибка "Database connection":
1. Проверьте, что PostgreSQL запущен: `pg_isready`
2. Проверьте `DATABASE_URL` в `.env.local`
3. Убедитесь, что пароль правильный

### Если таблицы не найдены:
1. Подключитесь к БД: `psql -U postgres -d web_wallet_db`
2. Проверьте таблицы: `\dt`
3. При необходимости примените схемы заново

---

**Статус:** ✅ База данных восстановлена
**Дата:** 2025-11-11
**Время:** ~15 минут

_Отчет создан Claude Code_
