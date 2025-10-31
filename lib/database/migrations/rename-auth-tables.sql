-- Migration: Rename auth_* tables to standard NextAuth names
-- This allows DrizzleAdapter to work with existing tables

-- Rename tables
ALTER TABLE IF EXISTS auth_users RENAME TO users;
ALTER TABLE IF EXISTS auth_accounts RENAME TO accounts;
ALTER TABLE IF EXISTS auth_sessions RENAME TO sessions;
ALTER TABLE IF EXISTS auth_verification_tokens RENAME TO verification_tokens;

-- Update foreign key constraints
-- Note: PostgreSQL automatically updates foreign key constraints when tables are renamed
-- But we need to update indexes and triggers

-- Drop old indexes (they will be recreated with new names if needed)
DROP INDEX IF EXISTS idx_auth_users_email;
DROP INDEX IF EXISTS idx_auth_users_wallet;
DROP INDEX IF EXISTS idx_auth_users_auth_type;
DROP INDEX IF EXISTS idx_auth_users_created_at;
DROP INDEX IF EXISTS idx_auth_accounts_user_id;
DROP INDEX IF EXISTS idx_auth_accounts_provider;
DROP INDEX IF EXISTS idx_auth_sessions_user_id;
DROP INDEX IF EXISTS idx_auth_sessions_token;
DROP INDEX IF EXISTS idx_auth_sessions_expires;
DROP INDEX IF EXISTS idx_auth_verification_expires;

-- Create new indexes with standard names
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_auth_type ON users(auth_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON verification_tokens(expires);

-- Update trigger name (if exists)
DROP TRIGGER IF EXISTS trigger_auth_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_auth_users_updated_at();



