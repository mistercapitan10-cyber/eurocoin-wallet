# Отчет о состоянии функционала внутреннего баланса

## Дата анализа: 2024

## Текущее состояние

### ✅ Что уже реализовано и работает:

#### 1. База данных

- ✅ Таблицы созданы: `internal_wallets`, `internal_balances`, `internal_ledger`, `withdraw_requests`
- ✅ Миграция применяется автоматически при старте приложения (`lib/database/init.ts`)
- ✅ Индексы и триггеры настроены

#### 2. API эндпоинты

- ✅ `GET /api/internal-balance` - получение баланса пользователя
- ✅ `POST /api/internal-balance/credit` - начисление баланса (требует админский токен)
- ✅ `POST /api/internal-balance/debit` - списание баланса (требует админский токен)
- ✅ `POST /api/internal-balance/withdraw` - создание заявки на вывод
- ✅ `GET /api/internal-balance/withdraw` - история заявок пользователя
- ✅ `PATCH /api/internal-balance/withdraw/:id` - изменение статуса заявки (требует админский токен)
- ✅ `GET /api/internal-balance/withdraw/report` - CSV отчет для финансов

#### 3. UI компоненты

- ✅ `WalletStatistics` - отображает внутренний баланс пользователя
- ✅ `InternalPayoutForm` - форма для создания заявки на вывод
- ✅ Хук `useInternalBalance` - для получения баланса на фронтенде
- ✅ Хук `useWithdrawRequests` - для работы с заявками на вывод

#### 4. Автоматизация

- ✅ Скрипт `scripts/process-withdrawals.ts` для обработки одобренных заявок
- ✅ Автоматическое создание `internal_wallet` при первом запросе баланса
- ✅ Уведомления в Telegram о новых заявках и изменении статусов

#### 5. Безопасность

- ✅ Проверка лимитов (дневных и месячных)
- ✅ Проверка блок-листа адресов
- ✅ Транзакционная логика для предотвращения гонок
- ✅ Админская авторизация через `INTERNAL_BALANCE_SIGNING_SECRET`

---

## ❌ Что не хватает для полной работы:

### 1. **Админский интерфейс для начисления баланса**

**Статус:** ✅ Реализовано через Telegram бота

**Как использовать:**

1. Откройте Telegram бота
2. Отправьте команду `/credit`
3. Следуйте инструкциям бота:
   - Введите адрес кошелька пользователя (0x...)
   - Введите сумму для начисления
   - Введите описание/причину (или "-" для пропуска)
   - Подтвердите начисление

Подробная инструкция: см. `docs/telegram-balance-credit-guide.md`

**Альтернативный способ (через API):**
Админ также может начислить баланс через API запрос (см. `docs/admin-balance-guide.md`)

### 2. **Проверка переменных окружения**

**Необходимые переменные в `.env.local`:**

```env
# Обязательные для админских операций
INTERNAL_BALANCE_SIGNING_SECRET=your-secret-key-here

# Для автоматической обработки выводов
TREASURY_PRIVATE_KEY=0x...  # Приватный ключ кошелька для выплат
TREASURY_RPC_URL=https://... # RPC URL для блокчейна
TREASURY_WORKER_ID=treasury-bot
TREASURY_BATCH_SIZE=5
TREASURY_TX_CONFIRMATIONS=1

# Лимиты (опционально)
INTERNAL_WITHDRAW_DAILY_LIMIT=1000    # в токенах
INTERNAL_WITHDRAW_MONTHLY_LIMIT=5000  # в токенах

# Блок-лист адресов (опционально)
TREASURY_BLOCKED_ADDRESSES=0xdead...,0x123...
```

**Статус:** Нужно проверить, что все переменные настроены в `.env.local`

### 3. **Документация для админов**

**Что нужно добавить:**

- Инструкция по использованию API для начисления баланса
- Примеры запросов (curl, JavaScript)
- Описание процесса: начисление → вывод → обработка
- Troubleshooting guide

### 4. **Автоматическое создание internal_wallet при регистрации**

**Текущее состояние:** `internal_wallet` создается автоматически при первом запросе баланса через `ensureInternalWalletRecord`.

**Потенциальная проблема:** Если пользователь еще не запрашивал баланс, то `internal_wallet` не создан, и админ не сможет начислить баланс по `walletAddress` (хотя по `userId` должно работать).

**Решение:** Можно добавить создание `internal_wallet` в `register-wallet` endpoint, но это не критично, так как `ensureInternalWalletRecord` вызывается автоматически.

### 5. **Проверка работы скрипта обработки выводов**

**Что проверить:**

- Настроен ли `npm run treasury:process` в package.json
- Работает ли скрипт в dry-run режиме (если нет TREASURY_PRIVATE_KEY)
- Корректно ли обрабатываются ошибки

---

## Процесс работы функционала (как должно быть):

### 1. Начисление баланса админом:

```
Админ → UI/API → POST /api/internal-balance/credit
  → Проверка токена (INTERNAL_BALANCE_SIGNING_SECRET)
  → Создание/обновление internal_wallet (если нужно)
  → Начисление баланса в internal_balances
  → Запись в internal_ledger
  → Возврат обновленного баланса
```

### 2. Отображение баланса пользователем:

```
Пользователь → Страница с WalletStatistics
  → useInternalBalance hook
  → GET /api/internal-balance
  → Отображение баланса, pending, locked сумм
  → История операций из internal_ledger
```

### 3. Создание заявки на вывод:

```
Пользователь → InternalPayoutForm
  → POST /api/internal-balance/withdraw
  → Проверка лимитов и блок-листа
  → Создание записи в withdraw_requests (status: pending)
  → Резервирование суммы в pending_onchain
  → Уведомление в Telegram
```

### 4. Одобрение заявки админом:

```
Админ → API/UI → PATCH /api/internal-balance/withdraw/:id
  → Изменение статуса на "approved"
  → Уведомление в Telegram
```

### 5. Автоматическая обработка выплаты:

```
Скрипт → npm run treasury:process
  → Получение заявок со статусом "approved"
  → Изменение статуса на "processing"
  → Отправка транзакции в блокчейн (или dry-run)
  → Ожидание подтверждения
  → Изменение статуса на "completed"
  → Списание баланса и pending_onchain
  → Запись в internal_ledger (type: payout)
  → Уведомление в Telegram
```

---

## Рекомендации для запуска:

### Шаг 1: Проверить переменные окружения

```bash
# Проверить наличие всех необходимых переменных
grep -E "INTERNAL_BALANCE_SIGNING_SECRET|TREASURY_" .env.local
```

### Шаг 2: Применить миграции (если еще не применены)

Миграции применяются автоматически при старте приложения, но можно проверить вручную:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('internal_wallets', 'internal_balances', 'internal_ledger', 'withdraw_requests');
```

### Шаг 3: Протестировать начисление баланса

```bash
# Пример запроса для начисления баланса
curl -X POST http://localhost:3000/api/internal-balance/credit \
  -H "Content-Type: application/json" \
  -H "x-internal-admin-token: YOUR_SECRET" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "100",
    "reference": "Test credit",
    "createdBy": "admin"
  }'
```

### Шаг 4: Проверить отображение баланса

- Открыть сайт
- Подключить кошелек или войти через email
- Проверить отображение баланса в компоненте `WalletStatistics`

### Шаг 5: Протестировать вывод

- Создать заявку на вывод через `InternalPayoutForm`
- Одобрить заявку через API
- Запустить скрипт обработки: `npm run treasury:process`

---

## Выводы:

**Функционал реализован на ~95%:**

- ✅ База данных и миграции
- ✅ API эндпоинты
- ✅ UI для пользователей
- ✅ Автоматизация обработки выводов
- ✅ Админский интерфейс через Telegram бота
- ✅ Документация для админов (добавлена)
- ⚠️ Нужно проверить переменные окружения

**Главное, что нужно сделать:**

1. ✅ Создать админский интерфейс для начисления баланса (через Telegram бота)
2. Проверить и настроить все переменные окружения
3. ✅ Добавить документацию по использованию (Telegram бот + API)
