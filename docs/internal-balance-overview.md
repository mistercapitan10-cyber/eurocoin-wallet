# Внутренний баланс EURC — текущее состояние

## Готовность
Функциональность реализована по плану (Фазы 1–4):
- Созданы таблицы `internal_wallets`, `internal_balances`, `internal_ledger` и `withdraw_requests`, транзакционная логика вынесена в `lib/database/internal-balance-queries.ts`.
- Серверные ручки:
  - `GET /api/internal-balance` — снапшот баланса + история операций.
  - `POST /api/internal-balance/credit|debit` — сервисные начисления (требуют `INTERNAL_BALANCE_SIGNING_SECRET`).
  - `POST /api/internal-balance/withdraw` — пользовательская заявка на вывод (лимиты, санкционные проверки).
  - `PATCH /api/internal-balance/withdraw/:id` — изменение статуса (treasury).
  - `GET /api/internal-balance/withdraw` — история заявок конкретного пользователя.
  - `GET /api/internal-balance/withdraw/report` — CSV отчёт для финансов.
- UI: `WalletStatistics` и `InternalPayoutForm` показывают баланс, журнал, лимиты, статусы заявок, tx hash.
- Автоматизация: `npm run treasury:process` (скрипт `scripts/process-withdrawals.ts`) обрабатывает approved заявки, подписывает транзакции (или работает в dry-run), обновляет статусы и шлёт уведомления в Telegram.

## Как всё работает
1. **Регистрация пользователя.** При подключении MetaMask вызывается `/api/user/register-wallet`, создаётся запись в `users`, дальше `internal_wallets` привязывается к `userId`.
2. **Хранение баланса.**
   - `internal_balances.balance` — общий остаток.
   - `pending_onchain` — сумма, зарезервированная под выводы.
   - `locked_amount` — поле для будущих блокировок (например, расследования).
   - Любое начисление/списание проходит через `creditInternalBalance` / `debitInternalBalance`, чтобы обновить баланс и записать строку в `internal_ledger`.
3. **Подача заявки на вывод.**
   - Фронтенд отправляет `POST /api/internal-balance/withdraw` с суммой и адресом.
   - API проверяет:
     - наличие пользователя (wallet/email),
     - блок-лист адресов (`TREASURY_BLOCKED_ADDRESSES`),
     - дневной и месячный лимиты (`INTERNAL_WITHDRAW_DAILY_LIMIT`, `INTERNAL_WITHDRAW_MONTHLY_LIMIT`),
     - достаточность доступного остатка.
   - В таблице `withdraw_requests` создаётся запись со статусом `pending`, сумма добавляется в `pending_onchain`.
   - Telegram-бот уведомляет о новой заявке (`notifyNewWithdrawRequest`).
4. **Обработка оператором.**
   - Через админ-ручку `PATCH /api/internal-balance/withdraw/:id` можно выставить `approved`/`rejected`.
   - Скрипт `treasury:process` выбирает approved заявки (`getWithdrawExecutionQueue`), переключает их в `processing`, формирует и подписывает `transfer` (через ethers + `TREASURY_PRIVATE_KEY`).
   - После подтверждения транзакции статус становится `completed`, `pending_onchain` и `balance` уменьшаются, а в `internal_ledger` создаётся запись типа `payout`.
   - Любые сбои помечают заявку как `rejected`, чтобы сумма вернулась в доступный остаток.
   - Об изменении статуса бот сообщает в Telegram (`notifyWithdrawStatusChange`).
5. **Отчётность.**
   - `/api/internal-balance/withdraw` (GET) — выводит историю конкретного пользователя в UI.
   - `/api/internal-balance/withdraw/report` — CSV со всеми заявками (включает `wallet_address`, `user_id`, суммы, tx hash).

## Что нужно для запуска у себя
1. Применить миграцию `lib/database/migrations/add-internal-balance-tables.sql`.
2. Заполнить `.env.local`:
   ```env
   INTERNAL_BALANCE_SIGNING_SECRET=...
   INTERNAL_WITHDRAW_DAILY_LIMIT=1000    # в токенах, необязательно
   INTERNAL_WITHDRAW_MONTHLY_LIMIT=5000  # в токенах, необязательно
   TREASURY_BLOCKED_ADDRESSES=0xdead...,0x123...
   TREASURY_PRIVATE_KEY=0xabc...         # можно опустить для dry-run
   TREASURY_RPC_URL=https://...
   TREASURY_WORKER_ID=treasury-bot
   TREASURY_BATCH_SIZE=5
   TREASURY_TX_CONFIRMATIONS=1
   ```
3. Для теста:
   - Подключить кошелёк, отправить заявку на вывод в UI.
   - Одобрить заявку (через admin API либо напрямую в БД).
   - Запустить `npm run treasury:process` — убедиться, что статус стал `completed`, баланс уменьшился, а Telegram получил сообщение.
