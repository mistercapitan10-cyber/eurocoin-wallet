-- =============================================================================
-- Migration: Verify user_id columns and foreign keys on requests tables
-- =============================================================================
-- Idempotent migration to ensure user_id exists, indexed, and references users(id)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- exchange_requests.user_id
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'exchange_requests'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE exchange_requests
      ADD COLUMN user_id UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exchange_requests_user_id_fkey'
  ) THEN
    ALTER TABLE exchange_requests
      ADD CONSTRAINT exchange_requests_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exchange_requests_user_id
  ON exchange_requests(user_id);

COMMENT ON COLUMN exchange_requests.user_id IS
  'Reference to users table for OAuth-authenticated users (NULL for legacy wallet-only requests)';

-- -----------------------------------------------------------------------------
-- internal_requests.user_id
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'internal_requests'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE internal_requests
      ADD COLUMN user_id UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'internal_requests_user_id_fkey'
  ) THEN
    ALTER TABLE internal_requests
      ADD CONSTRAINT internal_requests_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_internal_requests_user_id
  ON internal_requests(user_id);

COMMENT ON COLUMN internal_requests.user_id IS
  'Reference to users table for OAuth-authenticated users (NULL for legacy wallet-only requests)';

-- =============================================================================
-- End of Migration
-- =============================================================================
