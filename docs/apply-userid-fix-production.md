# Применение миграции для исправления userId колонок в Production

## Проблема

Ошибка `42703` - база данных ожидает колонку `userId` (camelCase), а SQL запросы используют `user_id` (snake_case).

## Решение: Применить миграцию

### Вариант 1: Через Vercel CLI (Рекомендуется)

1. Установите Vercel CLI (если еще не установлен):

```bash
npm i -g vercel
```

2. Подключитесь к вашему проекту:

```bash
vercel login
vercel link
```

3. Выполните SQL миграцию через Vercel CLI:

```bash
# Получите DATABASE_URL из Vercel
vercel env pull .env.production

# Примените миграцию
psql $DATABASE_URL -f lib/database/migrations/fix-userid-column-names.sql
```

### Вариант 2: Через Vercel Dashboard + SQL клиент

1. Получите `DATABASE_URL` из Vercel:
   - Vercel Dashboard → Settings → Environment Variables
   - Найдите `DATABASE_URL`
   - Скопируйте значение

2. Подключитесь к базе данных через любой PostgreSQL клиент:
   - DBeaver, pgAdmin, или через терминал с `psql`

3. Выполните SQL команды:

```sql
-- Переименовать колонки
ALTER TABLE accounts RENAME COLUMN user_id TO "userId";
ALTER TABLE sessions RENAME COLUMN user_id TO "userId";

-- Обновить индексы
DROP INDEX IF EXISTS idx_accounts_user_id;
CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts("userId");

DROP INDEX IF EXISTS idx_sessions_user_id;
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions("userId");
```

### Вариант 3: Через Node.js скрипт локально

Если у вас есть доступ к `DATABASE_URL`:

```bash
# Установите DATABASE_URL в .env.local
echo "DATABASE_URL=your-production-database-url" >> .env.local

# Запустите скрипт миграции
npm run auth:fix-userid
```

### Вариант 4: Через Vercel Function (временный эндпоинт)

Если у вас нет прямого доступа к базе данных, можно создать временный API route:

1. Создайте файл `app/api/fix-db/route.ts` (временно)
2. Выполните миграцию через этот endpoint
3. Удалите файл после применения

## Проверка после миграции

После применения миграции проверьте:

```sql
-- Проверить колонки
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'accounts'
AND column_name IN ('user_id', 'userId');

-- Должен вернуть только 'userId'
```

## После миграции

1. Перезапустите deployment в Vercel (Redeploy)
2. Попробуйте войти через Google снова
3. Ошибка `42703` должна исчезнуть

## Важно

⚠️ **Эта миграция изменяет структуру базы данных.**

- Сделайте backup базы данных перед применением
- Примените миграцию в нерабочее время (если возможно)
- Проверьте, что миграция применена успешно
