# Руководство администратора: Начисление внутреннего баланса

## Быстрый старт

### 1. Настройка переменных окружения

Убедитесь, что в `.env.local` установлена переменная:
```env
INTERNAL_BALANCE_SIGNING_SECRET=your-secret-key-here
```

### 2. Начисление баланса через API

#### Вариант 1: По wallet address

```bash
curl -X POST http://localhost:3000/api/internal-balance/credit \
  -H "Content-Type: application/json" \
  -H "x-internal-admin-token: YOUR_SECRET" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "100.5",
    "reference": "Refund for request #123",
    "createdBy": "admin@example.com"
  }'
```

#### Вариант 2: По userId

```bash
curl -X POST http://localhost:3000/api/internal-balance/credit \
  -H "Content-Type: application/json" \
  -H "x-internal-admin-token: YOUR_SECRET" \
  -d '{
    "userId": "user-uuid-here",
    "amount": "50",
    "reference": "Bonus payment",
    "createdBy": "admin@example.com"
  }'
```

#### Вариант 3: Использование amountMinor (в минимальных единицах)

Если нужно указать точную сумму в минимальных единицах токена (wei для ETH, satoshi для BTC):

```bash
curl -X POST http://localhost:3000/api/internal-balance/credit \
  -H "Content-Type: application/json" \
  -H "x-internal-admin-token: YOUR_SECRET" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amountMinor": "100000000000000000000",
    "reference": "Precise amount",
    "createdBy": "admin@example.com"
  }'
```

### 3. Параметры запроса

#### Обязательные параметры:
- `userId` ИЛИ `walletAddress` - идентификатор пользователя
- `amount` ИЛИ `amountMinor` - сумма для начисления

#### Опциональные параметры:
- `tokenSymbol` - символ токена (по умолчанию используется из TOKEN_CONFIG)
- `reference` - описание/причина начисления (отображается в истории)
- `metadata` - дополнительные метаданные (JSON объект)
- `createdBy` - кто создал начисление (по умолчанию "system")

### 4. Примеры использования

#### Начисление возврата средств:
```bash
curl -X POST http://localhost:3000/api/internal-balance/credit \
  -H "Content-Type: application/json" \
  -H "x-internal-admin-token: YOUR_SECRET" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "250.75",
    "reference": "Refund for exchange request #EX-2024-001",
    "metadata": {
      "requestId": "EX-2024-001",
      "reason": "exchange_failed",
      "originalAmount": "300"
    },
    "createdBy": "admin@example.com"
  }'
```

#### Начисление бонуса:
```bash
curl -X POST http://localhost:3000/api/internal-balance/credit \
  -H "Content-Type: application/json" \
  -H "x-internal-admin-token: YOUR_SECRET" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": "10",
    "reference": "Welcome bonus",
    "metadata": {
      "campaign": "welcome_bonus_2024",
      "promoCode": "WELCOME2024"
    },
    "createdBy": "marketing@example.com"
  }'
```

### 5. Проверка баланса пользователя

После начисления можно проверить баланс:

```bash
# По wallet address
curl http://localhost:3000/api/internal-balance?walletAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# По сессии пользователя (требует авторизацию)
curl http://localhost:3000/api/internal-balance \
  -H "Cookie: next-auth.session-token=..."
```

### 6. Использование в JavaScript/TypeScript

```typescript
async function creditBalance(walletAddress: string, amount: string) {
  const response = await fetch('/api/internal-balance/credit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-admin-token': process.env.INTERNAL_BALANCE_SIGNING_SECRET!,
    },
    body: JSON.stringify({
      walletAddress,
      amount,
      reference: 'Manual credit',
      createdBy: 'admin@example.com',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to credit balance');
  }

  return await response.json();
}
```

### 7. Обработка ошибок

#### Ошибка авторизации (401):
```json
{
  "error": "Invalid admin token"
}
```
**Решение:** Проверьте, что заголовок `x-internal-admin-token` содержит правильный секрет.

#### Ошибка валидации (400):
```json
{
  "error": "Wallet address is not registered"
}
```
**Решение:** Убедитесь, что пользователь зарегистрирован в системе (вызван `/api/user/register-wallet`).

#### Ошибка конфигурации (503):
```json
{
  "error": "INTERNAL_BALANCE_SIGNING_SECRET is not configured"
}
```
**Решение:** Установите переменную `INTERNAL_BALANCE_SIGNING_SECRET` в `.env.local`.

### 8. Безопасность

⚠️ **Важно:**
- Никогда не коммитьте `INTERNAL_BALANCE_SIGNING_SECRET` в репозиторий
- Используйте сильный случайный секрет (минимум 32 символа)
- Ограничьте доступ к API только доверенным администраторам
- Логируйте все операции начисления баланса для аудита

### 9. Аудит операций

Все операции начисления записываются в таблицу `internal_ledger` с полями:
- `entry_type`: "credit"
- `amount`: сумма начисления
- `balance_after`: баланс после операции
- `reference`: описание операции
- `created_by`: кто создал операцию
- `created_at`: время операции

Для просмотра истории операций пользователя:
```bash
curl http://localhost:3000/api/internal-balance?walletAddress=0x...
```

### 10. Списывание баланса

Для списания баланса используйте аналогичный запрос к `/api/internal-balance/debit`:

```bash
curl -X POST http://localhost:3000/api/internal-balance/debit \
  -H "Content-Type: application/json" \
  -H "x-internal-admin-token: YOUR_SECRET" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "10",
    "reference": "Penalty for violation",
    "createdBy": "admin@example.com"
  }'
```

**Важно:** Списание невозможно, если баланс недостаточен. В этом случае вернется ошибка `INSUFFICIENT_FUNDS`.

