-- Migration: Add user_id columns to requests tables
-- Description: Adds user_id UUID columns for OAuth user tracking
-- Date: 2025-10-31

-- Add user_id to exchange_requests
ALTER TABLE exchange_requests ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_exchange_requests_user_id ON exchange_requests(user_id);

-- Add user_id to internal_requests
ALTER TABLE internal_requests ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_internal_requests_user_id ON internal_requests(user_id);
