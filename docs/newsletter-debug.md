# Диагностика проблемы с командой /newsletter

## Возможные причины

### 1. Проблема с авторизацией

Команда `/newsletter` имеет двойную проверку доступа:

- `checkAccess(ctx)` - проверяет `TELEGRAM_ALLOWED_USER_ID`
- Дополнительная проверка `TELEGRAM_MANAGER_CHAT_ID`

**Решение:** Убедитесь, что в переменных окружения установлены:

```bash
TELEGRAM_ALLOWED_USER_ID=ваш_user_id
TELEGRAM_MANAGER_CHAT_ID=ваш_chat_id
```

Чтобы узнать свой User ID и Chat ID, используйте команду `/myid` в боте.

### 2. Таблица newsletter_subscribers не существует

Если миграции не применены, запрос к БД упадет с ошибкой.

**Решение:** Примените миграцию в Neon SQL Editor:

```sql
-- Выполните SQL из файла lib/database/migrations/add-newsletter-tables.sql
```

Или используйте команду:

```bash
npm run db:newsletter
```

### 3. Проблема с подключением к БД

Проверьте переменные окружения:

```bash
DATABASE_URL=postgresql://...
```

### 4. Логирование

После обновления кода добавлено логирование. Проверьте логи в Vercel или вашем хостинге:

- `[newsletter] Command received` - команда получена
- `[newsletter] Access denied` - доступ запрещен
- `[newsletter] Querying database` - запрос к БД
- `[newsletter] Error` - ошибка

## Как проверить

1. **Проверьте переменные окружения:**
   - `TELEGRAM_ALLOWED_USER_ID` - должен совпадать с вашим User ID
   - `TELEGRAM_MANAGER_CHAT_ID` - должен совпадать с вашим Chat ID
   - `DATABASE_URL` - должен быть корректным

2. **Проверьте таблицы в БД:**

   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_name LIKE 'newsletter%';
   ```

   Должны быть видны:
   - `newsletter_subscribers`
   - `newsletter_campaigns`
   - `newsletter_logs`

3. **Проверьте логи:**
   После выполнения `/newsletter` проверьте логи приложения на наличие сообщений `[newsletter]`.

## Быстрое решение

Если команда не работает, попробуйте:

1. Выполните `/myid` в боте - получите ваш Chat ID
2. Установите переменные окружения:
   ```
   TELEGRAM_ALLOWED_USER_ID=ваш_user_id
   TELEGRAM_MANAGER_CHAT_ID=ваш_chat_id
   ```
3. Примените миграцию newsletter (если не применена)
4. Перезапустите приложение
5. Попробуйте `/newsletter` снова

## Отладка

Если проблема сохраняется, проверьте логи:

- В Vercel: Dashboard → Your Project → Functions → View Logs
- Ищите строки с `[newsletter]` для понимания где именно происходит ошибка
