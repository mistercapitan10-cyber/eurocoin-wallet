# Инструкции по исправлению Email аутентификации

## Проблема

Email провайдер в NextAuth v5 требует адаптер базы данных для хранения токенов верификации. Адаптер настроен, но есть проблема с именами таблиц.

## Решение

Есть два варианта:

### Вариант 1: Переименовать таблицы (рекомендуется)

Ваша схема использует префикс `auth_`, но DrizzleAdapter ожидает стандартные имена:

```sql
-- Переименовать таблицы
ALTER TABLE auth_users RENAME TO users;
ALTER TABLE auth_accounts RENAME TO accounts;
ALTER TABLE auth_sessions RENAME TO sessions;
ALTER TABLE auth_verification_tokens RENAME TO verification_tokens;
```

Затем удалите старые индексы и создайте новые:

```sql
-- Пересоздать индексы с новыми именами
DROP INDEX IF EXISTS idx_auth_users_email;
DROP INDEX IF EXISTS idx_auth_users_wallet;
-- ... и т.д. для всех индексов

-- Создать новые индексы
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
-- ... и т.д.
```

### Вариант 2: Использовать существующие таблицы (если хотите сохранить префикс)

Нужно создать TypeScript схему Drizzle, которая соответствует вашим таблицам, и настроить адаптер с кастомными именами.

## Шаги для активации

1. **Убедитесь, что DATABASE_URL установлен в `.env.local`:**

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/web_wallet_db
   ```

2. **Примените миграцию NextAuth:**

   ```bash
   npm run auth:migrate
   ```

3. **Убедитесь, что таблицы созданы с правильными именами** (см. варианты выше)

4. **Перезапустите сервер:**

   ```bash
   npm run dev有
   ```

5. **Проверьте логи** - должно появиться:
   ```
   [AUTH] ✅ Database adapter enabled for email authentication
   ```

## Если письма не приходят

1. Проверьте, что `RESEND_API_KEY` установлен в `.env.local`
2. Проверьте, что `SENDER_EMAIL` установлен (можно использовать `noreply@resend.dev` для тестирования)
3. Проверьте логи в консоли на наличие ошибок отправки email
4. Проверьте папку спам в вашей почте

## Проверка работоспособности

1. Перейдите на `/login`
2. Нажмите "Войти по электронной почте"
3. Введите email
4. Нажмите "Отправить ссылку для входа"
5. Проверьте почту (и папку спам)
6. Перейдите по ссылке из письма
7. Должны попасть на главную страницу






