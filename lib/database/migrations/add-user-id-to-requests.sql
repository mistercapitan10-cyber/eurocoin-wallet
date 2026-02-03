-- =============================================================================
-- Migration: Add user_id to requests tables for OAuth support
-- =============================================================================
-- This migration adds user_id foreign keys to exchange_requests and
-- internal_requests tables to support OAuth-authenticated users
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Add user_id column to exchange_requests
-- -----------------------------------------------------------------------------

ALTER TABLE exchange_requests
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_exchange_requests_user_id ON exchange_requests(user_id);

-- Comment for documentation
COMMENT ON COLUMN exchange_requests.user_id IS 'Reference to users table for OAuth-authenticated users (NULL for legacy wallet-only requests)';

-- -----------------------------------------------------------------------------
-- Add user_id column to internal_requests
-- -----------------------------------------------------------------------------

ALTER TABLE internal_requests
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_internal_requests_user_id ON internal_requests(user_id);

-- Comment for documentation
COMMENT ON COLUMN internal_requests.user_id IS 'Reference to users table for OAuth-authenticated users (NULL for legacy wallet-only requests)';

-- -----------------------------------------------------------------------------
-- Migration Notes
-- -----------------------------------------------------------------------------

-- To apply this migration:
-- psql -U username -d database_name -f lib/database/migrations/add-user-id-to-requests.sql

-- To rollback (DANGER - removes user_id columns and indexes):
-- DROP INDEX IF EXISTS idx_exchange_requests_user_id;
-- ALTER TABLE exchange_requests DROP COLUMN IF EXISTS user_id;
-- DROP INDEX IF EXISTS idx_internal_requests_user_id;
-- ALTER TABLE internal_requests DROP COLUMN IF EXISTS user_id;

-- =============================================================================
-- End of Migration
-- =============================================================================
