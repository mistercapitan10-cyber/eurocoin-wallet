# Проверка и исправление имен колонок в таблице accounts

## Проблема
Ошибка: `column accounts.provider_account_id does not exist`

Это означает, что в базе данных колонка называется не `provider_account_id`, а скорее всего `providerAccountId` (camelCase).

## Шаг 1: Проверьте реальные имена колонок

Выполните этот SQL запрос в вашей базе данных:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accounts' 
ORDER BY ordinal_position;
```

Это покажет все колонки в таблице `accounts` и их реальные имена.

## Шаг 2: Исправьте схему или базу данных

### Вариант A: Если колонки в базе в camelCase (providerAccountId)

Если колонки в базе в camelCase, то схема уже исправлена. Просто перезапустите сервер.

### Вариант B: Если колонки в базе в snake_case (provider_account_id)

Если колонки в базе в snake_case, нужно вернуть схему обратно:

```typescript
providerAccountId: text("provider_account_id").notNull(),
```

Но тогда нужно понять почему ошибка говорит что колонка не существует.

## Шаг 3: Если нужно переименовать колонки в базе

Если в базе колонки в snake_case, но нужно использовать camelCase:

```sql
-- Переименовать колонки в accounts таблице
ALTER TABLE accounts RENAME COLUMN provider_account_id TO "providerAccountId";
ALTER TABLE accounts RENAME COLUMN refresh_token TO "refreshToken";
ALTER TABLE accounts RENAME COLUMN access_token TO "accessToken";
ALTER TABLE accounts RENAME COLUMN expires_at TO "expiresAt";
ALTER TABLE accounts RENAME COLUMN token_type TO "tokenType";
ALTER TABLE accounts RENAME COLUMN id_token TO "idToken";
ALTER TABLE accounts RENAME COLUMN session_state TO "sessionState";
```

## Важно

После изменения схемы или базы данных:
1. Перезапустите сервер
2. Проверьте что адаптер правильно инициализирован
3. Попробуйте войти через Google снова

