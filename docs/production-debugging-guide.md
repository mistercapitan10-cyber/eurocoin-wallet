# Руководство по отладке ошибок в продакшене

## Ошибка: "Failed to load internal balance snapshot"

### Шаг 1: Проверьте логи сервера

В консоли продакшена (Vercel/другой хостинг) ищите логи с префиксом `[api:internal-balance]`:

**Успешный запрос:**
```
[api:internal-balance] Request received: { hasSession: true, userId: "...", ... }
[api:internal-balance] Loading snapshot: { userId: "...", walletAddress: "..." }
[api:internal-balance] Snapshot loaded successfully: { walletId: "...", balance: "...", ... }
```

**Ошибка базы данных:**
```
[api:internal-balance] Database error when fetching user: ...
[api:internal-balance] Error details: { error: "...", stack: "..." }
```

**Ошибка snapshot:**
```
[api:internal-balance] Failed to load balance snapshot: ...
[api:internal-balance] Error details: { userId: "...", errorMessage: "...", ... }
```

### Шаг 2: Проверьте переменные окружения

Убедитесь, что в продакшене настроены:

```env
# Обязательно
DATABASE_URL=postgresql://user:password@host:5432/database
# или
DATABASE_POSTGRES_URL=postgresql://user:password@host:5432/database

# Для RPC (опционально, но рекомендуется)
NEXT_PUBLIC_RPC_URL_MAINNET=https://mainnet.infura.io/v3/YOUR_KEY
# или публичный RPC (используется по умолчанию)
```

### Шаг 3: Проверьте базу данных

#### 3.1. Подключение к БД

```bash
# Проверьте подключение
psql $DATABASE_URL -c "SELECT version();"
```

#### 3.2. Проверьте таблицы

```sql
-- Проверка существования таблиц
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('internal_wallets', 'internal_balances', 'internal_ledger', 'withdraw_requests', 'users');
```

Если таблиц нет, примените миграции:

```bash
# В продакшене (через Vercel CLI или SSH)
npm run db:init
npm run db:migrate
```

#### 3.3. Проверьте пользователя

```sql
-- Проверка пользователя
SELECT id, wallet_address, auth_type, created_at
FROM users
WHERE wallet_address = '0x899cd926a9028afe9056e76cc01f32ee859e7a65';
```

### Шаг 4: Проверьте сессию

Проверьте, что NextAuth работает правильно:

1. Откройте DevTools → Application → Cookies
2. Найдите cookie с именем `authjs.session-token` или похожим
3. Проверьте, что сессия существует

### Шаг 5: Проверьте консоль браузера

В консоли браузера должны быть детальные ошибки:

```
[hooks:useInternalBalance] Failed to load balance: Error: Failed to load internal balance snapshot (Internal wallet identifier requires userId)
```

Это поможет понять точную причину ошибки.

## Типичные проблемы и решения

### Проблема 1: "Internal wallet identifier requires userId"

**Причина:** `userId` не передается в `getInternalBalanceSnapshot`.

**Решение:**
1. Проверьте, что сессия работает (`session?.user?.id` существует)
2. Проверьте логи: `[api:internal-balance] Request received: { userId: ... }`
3. Если `userId` отсутствует, проверьте NextAuth конфигурацию

### Проблема 2: "Database error while fetching user"

**Причина:** Проблема с подключением к базе данных или таблица `users` не существует.

**Решение:**
1. Проверьте `DATABASE_URL` в продакшене
2. Проверьте доступность базы данных
3. Примените миграции: `npm run db:init`

### Проблема 3: "Wallet is not registered in the system"

**Причина:** Пользователь с таким `walletAddress` не найден в таблице `users`.

**Решение:**
1. Зарегистрируйте пользователя через сайт или API
2. Или используйте скрипт: `tsx scripts/register-user-direct.ts <wallet> <name>`

### Проблема 4: "Authentication required to read internal balance"

**Причина:** Пользователь не аутентифицирован или сессия не работает.

**Решение:**
1. Проверьте, что пользователь залогинен
2. Проверьте NextAuth конфигурацию
3. Проверьте cookies в браузере

## Быстрая диагностика

### Команда для проверки всего:

```bash
# 1. Проверка подключения к БД
psql $DATABASE_URL -c "SELECT 1;" || echo "❌ БД недоступна"

# 2. Проверка таблиц
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('internal_wallets', 'internal_balances', 'internal_ledger', 'users');" || echo "❌ Таблицы не найдены"

# 3. Проверка пользователя
psql $DATABASE_URL -c "SELECT id, wallet_address FROM users LIMIT 1;" || echo "❌ Пользователи не найдены"
```

## После исправления

1. **Перезапустите приложение** в продакшене
2. **Проверьте логи** - должны появиться детальные сообщения
3. **Проверьте работу** - баланс должен загружаться без ошибок
4. **Мониторьте логи** в течение нескольких часов для выявления других проблем

## Контакты для поддержки

Если проблема не решается:
1. Проверьте логи сервера с префиксом `[api:internal-balance]`
2. Сохраните детали ошибки из консоли браузера
3. Проверьте переменные окружения в продакшене
4. Проверьте состояние базы данных

