# SQL миграция для продакшена - NextAuth таблицы

## ⚠️ КРИТИЧНО: Таблица `users` не существует!

Ошибка в логах:

```
error: relation "users" does not exist
code: '42P01'
```

**Это означает, что таблицы NextAuth не созданы в продакшн БД!**

---

## Полный SQL для применения:

Скопируйте и выполните весь SQL ниже в вашем SQL редакторе продакшена:

```sql
-- =============================================================================
-- Migration: Create NextAuth tables with standard names
-- These tables match what DrizzleAdapter expects
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
-- Table: users
-- =============================================================================
-- Users table (Note: NextAuth expects "users", not "user")
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE,
  email_verified TIMESTAMP WITH TIME ZONE,
  image TEXT,

  -- Custom fields from auth_users schema
  auth_type TEXT NOT NULL DEFAULT 'email' CHECK (auth_type IN ('email', 'wallet')),
  wallet_address TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_auth_type ON users(auth_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- =============================================================================
-- Table: accounts
-- =============================================================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

-- Indexes for accounts table
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider);

-- =============================================================================
-- Table: sessions
-- =============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);

-- =============================================================================
-- Table: verification_tokens
-- =============================================================================
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Index for verification_tokens table
CREATE INDEX IF NOT EXISTS idx_verification_expires ON verification_tokens(expires);

-- =============================================================================
-- Trigger для автоматического обновления updated_at в users
-- =============================================================================
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Проверка после применения:

Выполните этот запрос, чтобы убедиться, что таблицы созданы:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('users', 'accounts', 'sessions', 'verification_tokens')
ORDER BY table_name;
```

Должно вернуться 4 строки:

- `accounts`
- `sessions`
- `users`
- `verification_tokens`

---

## Что делать дальше:

1. ✅ Выполните SQL выше в продакшн БД
2. ✅ Проверьте создание таблиц запросом выше
3. ✅ Перезапустите приложение в продакшене (если нужно)
4. ✅ Проверьте работу внутреннего баланса

После этого ошибка `relation "users" does not exist` должна исчезнуть!

---

## Важно:

**Порядок применения миграций:**

1. **Сначала** создайте таблицы NextAuth (`users`, `accounts`, `sessions`, `verification_tokens`)
2. **Затем** создайте таблицы внутреннего баланса (`internal_wallets`, `internal_balances`, `internal_ledger`, `withdraw_requests`)

Без таблицы `users` система не сможет работать, так как все пользователи хранятся там!
