# Диагностика ошибки "Failed to load internal balance snapshot"

## Проблема

После применения миграций ошибка все еще возникает. HTTP 500 от `/api/internal-balance`.

## Что было улучшено

### 1. Детальное логирование

Добавлено логирование на каждом этапе:

- `[internal-balance-queries]` - логи из функций работы с БД
- `[api:internal-balance]` - логи из API endpoint

### 2. Улучшенная обработка ошибок

- Каждая операция обернута в try-catch
- Детальные сообщения об ошибках с контекстом
- Проверка результатов запросов к БД

## Диагностика

### Шаг 1: Проверьте логи сервера

После деплоя проверьте логи в консоли продакшена (Vercel/другой хостинг).

Ищите строки с префиксами:
- `[api:internal-balance]`
- `[internal-balance-queries]`

Примеры логов:

```
[api:internal-balance] Request received: { hasSession: true, userId: "...", ... }
[internal-balance-queries] getInternalBalanceSnapshot called: { userId: "...", ... }
[internal-balance-queries] Wallet ensured: { walletId: "..." }
[internal-balance-queries] Balance ensured: { balanceId: "..." }
[internal-balance-queries] Ledger loaded: { entries: 0 }
```

Если есть ошибка, вы увидите:

```
[internal-balance-queries] Failed to ensure wallet: Error: ...
[internal-balance-queries] Failed to ensure balance: Error: ...
[internal-balance-queries] Failed to load ledger: Error: ...
```

### Шаг 2: Запустите диагностический скрипт

Локально (если у вас есть доступ к продакшн БД):

```bash
npm run diagnose:balance 0x899CD926A9028aFE9056e76Cc01f32EE859e7a65
```

Скрипт проверит:
1. ✅ Подключение к БД
2. ✅ Существование таблиц
3. ✅ Функцию `update_updated_at_column`
4. ✅ Наличие пользователя
5. ✅ Внутренний кошелек
6. ✅ Загрузку snapshot

### Шаг 3: Проверьте в SQL редакторе

Выполните эти запросы в продакшн БД:

#### Проверка пользователя:

```sql
SELECT id, email, wallet_address 
FROM users 
WHERE wallet_address = '0x899cd926a9028afe9056e76cc01f32ee859e7a65';
```

#### Проверка внутреннего кошелька:

```sql
SELECT * 
FROM internal_wallets 
WHERE user_id = '<userId из предыдущего запроса>';
```

#### Проверка баланса:

```sql
SELECT * 
FROM internal_balances 
WHERE wallet_id = '<walletId из предыдущего запроса>';
```

## Возможные причины ошибки

### 1. Пользователь не найден

**Симптомы:**
- В логах: `User not found for wallet: ...`
- HTTP 404 от API

**Решение:**
- Пользователь должен быть зарегистрирован в системе
- Используйте `/api/user/register-wallet` для регистрации

### 2. Проблема с подключением к БД

**Симптомы:**
- В логах: `Database query failed: ...`
- Ошибки подключения

**Решение:**
- Проверьте `DATABASE_URL` в переменных окружения продакшена
- Проверьте доступность БД

### 3. Ошибка при создании записи в internal_wallets

**Симптомы:**
- В логах: `Failed to insert internal_wallet: ...`
- Ошибка constraint violation

**Решение:**
- Проверьте, что таблица `internal_wallets` существует
- Проверьте, что функция `update_updated_at_column` существует
- Проверьте constraints таблицы

### 4. Ошибка при создании записи в internal_balances

**Симптомы:**
- В логах: `Failed to ensure balance record: ...`
- `Balance record not found after insert`

**Решение:**
- Проверьте, что таблица `internal_balances` существует
- Проверьте constraint `unique_wallet_token`

### 5. Проблема с функцией update_updated_at_column

**Симптомы:**
- Ошибка при создании триггеров
- `function update_updated_at_column() does not exist`

**Решение:**
- Выполните SQL из `docs/production-migration-sql.md`
- Убедитесь, что функция создана

## Что делать после диагностики

1. Скопируйте детали ошибки из логов
2. Отправьте мне для анализа
3. Или исправьте проблему согласно решениям выше

## Примеры успешных логов

```
[api:internal-balance] Request received: { hasSession: true, userId: "abc-123", ... }
[api:internal-balance] Loading snapshot: { userId: "abc-123", walletAddress: "0x..." }
[internal-balance-queries] getInternalBalanceSnapshot called: { userId: "abc-123", ... }
[internal-balance-queries] Wallet ensured: { walletId: "wallet-123" }
[internal-balance-queries] Balance ensured: { balanceId: "balance-123" }
[internal-balance-queries] Ledger loaded: { entries: 0 }
[api:internal-balance] Snapshot loaded successfully: { walletId: "wallet-123", balance: "0", ledgerEntries: 0 }
```

## Примеры ошибок

### Ошибка: пользователь не найден

```
[api:internal-balance] Fetching user by wallet: 0x...
[api:internal-balance] User not found for wallet: 0x...
```

**Решение:** Зарегистрируйте пользователя через `/api/user/register-wallet`

### Ошибка: проблема с БД

```
[internal-balance-queries] Failed to query internal_wallets: { userId: "...", error: "..." }
```

**Решение:** Проверьте подключение к БД и переменные окружения

### Ошибка: constraint violation

```
[internal-balance-queries] Failed to insert internal_wallet: { error: "duplicate key value violates unique constraint" }
```

**Решение:** Проверьте уникальные индексы в таблице

