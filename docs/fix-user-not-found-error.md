# Исправление ошибки "Database error while fetching user"

## Проблема

После применения миграций ошибка сохраняется:

```
Database error while fetching user
Failed query: select "id", "name", "email", "email_verified", "image", "auth_type", "wallet_address", "created_at", "updated_at" from "users" where "users"."wallet_address" = $1 limit $2
```

## Возможные причины

### 1. Пользователь не существует в таблице `users`

Самая вероятная причина - пользователь с кошельком `0x899cd926a9028afe9056e76cc01f32ee859e7a65` не зарегистрирован в системе.

### 2. Проблема с подключением к БД

Возможно, в продакшене используется неправильный `DATABASE_URL` или БД недоступна.

### 3. Проблема со схемой Drizzle

Возможно, схема Drizzle не совпадает с реальной структурой БД.

## Решение

### Шаг 1: Проверьте существование пользователя

Выполните этот SQL запрос в продакшн БД:

```sql
SELECT id, email, wallet_address, auth_type, created_at
FROM users
WHERE LOWER(wallet_address) = LOWER('0x899cd926a9028afe9056e76cc01f32ee859e7a65');
```

**Если запрос вернул 0 строк** - пользователь не существует, нужно его зарегистрировать.

### Шаг 2: Зарегистрируйте пользователя

#### Вариант A: Через API (рекомендуется)

Выполните POST запрос к `/api/user/register-wallet`:

```bash
curl -X POST https://www.euro-coin.eu/api/user/register-wallet \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x899cd926a9028afe9056e76cc01f32ee859e7a65",
    "name": "Test User"
  }'
```

Или используйте скрипт:

```bash
npm run test:balance-credit-full 0x899CD926A9028aFE9056e76Cc01f32EE859e7a65
```

#### Вариант B: Через SQL (если API не работает)

Выполните этот SQL в продакшн БД:

```sql
INSERT INTO users (wallet_address, auth_type, created_at, updated_at)
VALUES (
  LOWER('0x899cd926a9028afe9056e76cc01f32ee859e7a65'),
  'wallet',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (wallet_address) DO NOTHING
RETURNING id, wallet_address, auth_type;
```

### Шаг 3: Проверьте работу после регистрации

После регистрации пользователя:

1. Перезагрузите страницу с балансом
2. Проверьте логи сервера на наличие ошибок
3. Убедитесь, что баланс отображается корректно

## Диагностика

### Проверка подключения к БД

Выполните этот SQL запрос:

```sql
SELECT NOW() as current_time, current_database() as database_name;
```

Если запрос выполняется успешно - подключение к БД работает.

### Проверка структуры таблицы users

Выполните этот SQL запрос:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

Убедитесь, что все колонки существуют:

- `id` (uuid)
- `name` (text)
- `email` (text)
- `email_verified` (timestamp with time zone)
- `image` (text)
- `auth_type` (text)
- `wallet_address` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

### Проверка индексов

Выполните этот SQL запрос:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users';
```

Убедитесь, что существует индекс на `wallet_address`:

- `idx_users_wallet` или `users_wallet_address_key`

## Что было исправлено в коде

1. **Исправлена схема `accounts`:**
   - `providerAccountId` теперь правильно маппится на `provider_account_id` (snake_case)

2. **Улучшена функция `getUserByWalletAddress`:**
   - Добавлено детальное логирование
   - Нормализация адреса кошелька (lowercase)
   - Детальная обработка ошибок

3. **Улучшена обработка ошибок в API:**
   - Более информативные сообщения об ошибках
   - Детальное логирование

## Проверка логов

После деплоя проверьте логи сервера (Vercel/другой хостинг):

Ищите строки с префиксами:

- `[user-queries]` - логи из функции `getUserByWalletAddress`
- `[api:internal-balance]` - логи из API endpoint

Примеры успешных логов:

```
[user-queries] getUserByWalletAddress called: { walletAddress: "0x...", normalized: "0x..." }
[user-queries] User found: { userId: "...", email: null }
[api:internal-balance] User found: ...
```

Примеры ошибок:

```
[user-queries] Error in getUserByWalletAddress: { error: "...", ... }
[api:internal-balance] Database error when fetching user: ...
```

## Следующие шаги

1. ✅ Проверьте существование пользователя в БД
2. ✅ Зарегистрируйте пользователя, если его нет
3. ✅ Проверьте логи сервера после деплоя
4. ✅ Убедитесь, что баланс отображается корректно

Если ошибка сохранится после регистрации пользователя, скопируйте детали ошибки из логов и отправьте для дальнейшего анализа.
