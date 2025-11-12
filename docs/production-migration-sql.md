# SQL миграция для продакшена - Внутренний баланс

## ⚠️ ВАЖНО: Выполните этот SQL в продакшн базе данных

Скопируйте и выполните весь SQL ниже в вашем SQL редакторе продакшена.

---

## Полный SQL для применения:

```sql
-- =============================================================================
-- Migration: Internal balance infrastructure
-- Creates internal_wallets, internal_balances, internal_ledger, withdraw_requests tables
-- =============================================================================

-- Проверка существования функции update_updated_at_column (создаем если нет)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Table: internal_wallets
-- =============================================================================
CREATE TABLE IF NOT EXISTS internal_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  wallet_address VARCHAR(255),
  default_withdraw_address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_internal_wallets_user ON internal_wallets(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_internal_wallets_address
  ON internal_wallets(wallet_address)
  WHERE wallet_address IS NOT NULL;

-- =============================================================================
-- Table: internal_balances
-- =============================================================================
CREATE TABLE IF NOT EXISTS internal_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES internal_wallets(id) ON DELETE CASCADE,
  token_symbol VARCHAR(32) NOT NULL,
  balance NUMERIC(78, 0) DEFAULT 0 NOT NULL,
  pending_onchain NUMERIC(78, 0) DEFAULT 0 NOT NULL,
  locked_amount NUMERIC(78, 0) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_wallet_token UNIQUE (wallet_id, token_symbol)
);

CREATE INDEX IF NOT EXISTS idx_internal_balances_wallet ON internal_balances(wallet_id);
CREATE INDEX IF NOT EXISTS idx_internal_balances_token ON internal_balances(token_symbol);

-- =============================================================================
-- Table: internal_ledger
-- =============================================================================
CREATE TABLE IF NOT EXISTS internal_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES internal_wallets(id) ON DELETE CASCADE,
  token_symbol VARCHAR(32) NOT NULL,
  entry_type VARCHAR(32) NOT NULL,
  amount NUMERIC(78, 0) NOT NULL,
  balance_after NUMERIC(78, 0) NOT NULL,
  reference TEXT,
  metadata JSONB,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_internal_ledger_wallet ON internal_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_internal_ledger_created ON internal_ledger(created_at DESC);

-- =============================================================================
-- Table: withdraw_requests
-- =============================================================================
CREATE TABLE IF NOT EXISTS withdraw_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES internal_wallets(id) ON DELETE CASCADE,
  token_symbol VARCHAR(32) NOT NULL,
  amount NUMERIC(78, 0) NOT NULL,
  destination_address VARCHAR(255) NOT NULL,
  status VARCHAR(32) DEFAULT 'pending' NOT NULL,
  reviewer_id UUID,
  tx_hash VARCHAR(120),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_withdraw_wallet ON withdraw_requests(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_status ON withdraw_requests(status);

-- =============================================================================
-- Triggers для автоматического обновления updated_at
-- =============================================================================
DROP TRIGGER IF EXISTS trg_internal_wallets_updated ON internal_wallets;
CREATE TRIGGER trg_internal_wallets_updated
  BEFORE UPDATE ON internal_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_internal_balances_updated ON internal_balances;
CREATE TRIGGER trg_internal_balances_updated
  BEFORE UPDATE ON internal_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_withdraw_requests_updated ON withdraw_requests;
CREATE TRIGGER trg_withdraw_requests_updated
  BEFORE UPDATE ON withdraw_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Проверка после применения:

Выполните этот запрос, чтобы убедиться, что таблицы созданы:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('internal_wallets', 'internal_balances', 'internal_ledger', 'withdraw_requests')
ORDER BY table_name;
```

Должно вернуться 4 строки:
- `internal_balances`
- `internal_ledger`
- `internal_wallets`
- `withdraw_requests`

---

## Что делать дальше:

1. ✅ Выполните SQL выше в продакшн БД
2. ✅ Проверьте создание таблиц запросом выше
3. ✅ Перезапустите приложение в продакшене
4. ✅ Проверьте работу внутреннего баланса

После этого ошибка "Failed to load internal balance snapshot" должна исчезнуть!

