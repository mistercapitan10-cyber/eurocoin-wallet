# План реализации внутреннего баланса EURC

## 1. Цели и ограничения
- Пользователь видит персональный баланс EURC прямо в дашборде, независимо от подключения кошелька.
- Внутренний баланс пополняется/списывается бэком и синхронизируется с реальными трансферами токена.
- Пользователь может инициировать вывод на любой свой кошелек (MetaMask/адрес ERC‑20).
- Все операции логируются, доступны для аудита и не ломают существующий UX.

## 2. Архитектура данных
1. **Prisma/DB миграции**
   - `internal_wallets` (id, userId, defaultWithdrawAddress, createdAt, updatedAt).
   - `internal_balances` (id, walletId, tokenSymbol, balance, pendingOnChain, locked).
   - `internal_ledger` (id, walletId, type: credit|debit|adjustment|payout, amount, txHash?, meta JSONB, createdBy, createdAt).
   - `withdraw_requests` (id, walletId, amount, destinationAddress, status, reviewerId, txHash, createdAt, updatedAt).
2. Индексы: `walletId+tokenSymbol`, `withdraw_requests.status`, `ledger.walletId`.
3. Триггер/constraint для недопущения отрицательного баланса (проверка в транзакции).

## 3. API-слой (Next.js Route Handlers)
1. `GET /api/internal-balance` — возвращает баланс, ожидающие транзакции, последние движения.
2. `POST /api/internal-balance/credit` — админское начисление (защита по серверному ключу/роль MANAGER).
3. `POST /api/internal-balance/debit` — сервисное списание (например, при резервировании).
4. `POST /api/internal-balance/withdraw` — пользователь создает заявку на вывод.
5. `POST /api/internal-balance/withdraw/:id/approve|reject` — операционист подтверждает и проставляет on-chain txHash.
6. Все ручки работают с auth-миддлварой NextAuth (OAuth+wallet) и журналируют действия.

## 4. Бизнес-логика
1. **Начисления**
   - Источники: админ-панель, автоматические бонусы, результаты расследований.
   - При зачислении создается ledger-запись, баланс увеличивается в транзакции.
2. **Списания/резервы**
   - Перед выводом баланс блокируется (поле `locked` или отдельная сумма pending).
   - После подтверждения on-chain списания pending уменьшается, баланс фиксируется.
3. **Связь с фактическим EURC**
   - Вывод требует указания txHash и сети; данные сохраняются в `withdraw_requests`.
   - При неудачной транзакции статус возвращается в `failed`, а сумма расконфигурируется.

## 5. UI/UX изменения
1. **Dashboard**
   - В блоке `Wallet Statistics` показать две панели: `On-chain balance` и `Internal balance`.
   - Добавить историю операций (карточки из `internal_ledger`) с фильтрами.
2. **Форма вывода**
   - Новый компонент `InternalPayoutForm`: ввод суммы, адреса, MFA (код по email) + предпросмотр комиссии.
   - Интегрировать с существующей `InternalRequestForm` (чекбокс “Создать официальную заявку”).
3. **Навигация**
   - Новый раздел в дашборде “Внутренний кошелек” (якорь `#internal-balance`).
4. **Admin/MGR UI (можно позже)**
   - Инструменты начисления/одобрения в существующей админке или отдельной странице `/profile/internal-balance`.

## 6. Процесс вывода токенов
1. Пользователь подает запрос -> статус `pending`.
2. Бэкофицер проверяет KYC/лимиты -> `approved`.
3. Автоматический скрипт (или вручную через MetaMask кошелек управления) отправляет EURC -> получает `txHash`.
4. Через webhook/cron проверяется подтверждение транзакции -> статус `completed`.
5. Баланс обновляется, пользователь получает уведомление (email/Telegram).

## 7. Интеграция с существующей инфраструктурой
1. Авторизация: использовать `useAuth()` (email, wallet) и связывать с `internal_wallets`.
2. Notification pipeline: переиспользовать Telegram-бота/почтовые рассылки (`emails/`).
3. Использовать уже настроенные RPC/ethers для проверки статуса транзакций (cron job в `scripts/`).

## 8. Безопасность и соответствие
1. Все денежные действия только через серверные ключи и аудиторский лог.
2. Ограничения по лимитам: дневные/недельные суммы, особые статусы аккаунтов.
3. Валидация адресов (checksum, ban-лист, санкционные списки).
4. Хранение конфигурации в `.env`:
   - `INTERNAL_BALANCE_SIGNING_SECRET`
   - `WITHDRAW_DAILY_LIMIT`
   - `TREASURY_WALLET_ADDRESS`

## 9. Фазовый план внедрения

### Фаза 1 — Базовая инфраструктура (1 неделя)
- Подготовить Prisma миграции (`internal_wallets`, `internal_balances`, `internal_ledger`, `withdraw_requests`) и обновить seed-скрипты.
- Реализовать серверные сущности/репозитории с транзакционной логикой, покрыть юнит-тестами.
- Создать API `GET /api/internal-balance` и `POST /api/internal-balance/credit|debit`, ограничив доступ ролями MANAGER/ADMIN.
- Добавить на дашборд отображение внутреннего баланса и истории операций (read-only).
- Настроить конфиги `.env`, добавить переменные в `.env.example`, задокументировать процесс.
- Результат: менеджер может вручную начислить токены, пользователь видит свой баланс и журнал.

### Фаза 2 — Пользовательский вывод и уведомления (1–1.5 недели)
- Разработать `InternalPayoutForm`, валидацию суммы, адреса, MFA (email код), показ лимитов.
- Реализовать API `POST /api/internal-balance/withdraw` и админские ручки approve/reject с логированием.
- Добавить статусы заявок на фронте, интегрировать с существующим `InternalRequestForm` (связь заявок и баланса).
- Подключить уведомления: email (Resend) и Telegram-бот для операционистов о новых запросах.
- Результат: пользователь может запросить вывод, менеджер подтверждает через UI, есть нотификации.

### Фаза 3 — Ончейн-автоматизация и мониторинг (2 недели)
- Написать скрипт/воркер (Node cron) для исполнения одобренных выплат: формирование tx с `ethers`, подписание от treasury-аккаунта. ✅ `scripts/process-withdrawals.ts` (поддерживает dry-run и фактические переводы ERC-20).
- Добавить очередь/флаги `pendingOnChain`, связывать txHash, обрабатывать статусы (success/failed) через RPC-поллинг. ✅ Очередь реализована на `withdraw_requests`, статусы `approved → processing → completed`, балансы и ledger обновляются транзакционно.
- Реализовать retry-механику, алерты при ошибках, запись газовых метрик. (в прогрессе: базовый retry + auto reject при сбое, метрики TBD).
- Обновить UI: показывать состояние “в обработке”, txHash, ETA. ✅ InternalPayoutForm отображает все статусы и хэши транзакций.
- Результат: после одобрения выводов система сама отправляет EURC и синхронизирует статусы.

### Фаза 4 — Контроль, отчеты и интеграции (1 неделя)
- ✅ Лимиты и санкции: `INTERNAL_WITHDRAW_DAILY_LIMIT`, `INTERNAL_WITHDRAW_MONTHLY_LIMIT`, `TREASURY_BLOCKED_ADDRESSES` + отказ с кодами.
- ✅ Отчёты: `GET /api/internal-balance/withdraw/report` (+ токен) отдаёт CSV для бухгалтерии.
- ✅ Telegram-бот: уведомления о смене статусов (processing/completed/rejected) через `notifyWithdrawStatusChange`.
- Провести нагрузочные тесты, финальный аудит безопасности, обновить документацию (`architecture.md`, `refund-system-*`, `telegram-bot-security.md`).
- Результат: полный производственный флоу с мониторингом, отчетностью и процессами комплаенса.

## 10. Тестирование
1. Юнит-тесты ledger операций (положительные/отрицательные сценарии, гонки).
2. Интеграционные тесты API (supertest) с мок-юзером.
3. E2E сценарии: начисление → отображение → вывод → подтверждение.
4. Лоад-тест (k6) для массовых начислений/запросов.

## 11. Документация
- Обновить `architecture.md` (диаграмма потоков средств).
- Добавить инструкции для операторов в `docs/refund-system-*.md`.
- Описать переменные окружения и лимиты в `.env.example`.
- Новые переменные:
  - `TREASURY_PRIVATE_KEY`, `TREASURY_RPC_URL` — кошелёк и RPC для автоматических выплат (при отсутствии скрипт работает в dry-run).
  - `TREASURY_WORKER_ID`, `TREASURY_BATCH_SIZE`, `TREASURY_TX_CONFIRMATIONS` — настройки обработчика (`npm run treasury:process`).
  - `INTERNAL_WITHDRAW_DAILY_LIMIT`, `INTERNAL_WITHDRAW_MONTHLY_LIMIT`, `TREASURY_BLOCKED_ADDRESSES` — лимиты и санкционные списки.
