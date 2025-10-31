-- Migration: Add unique constraint to chatbot_sessions
-- Description: Adds unique constraint on user_wallet_address for proper ON CONFLICT handling
-- Date: 2025-10-31

-- ============================================
-- 1. Add unique constraint to chatbot_sessions
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbot_sessions_wallet_unique ON chatbot_sessions(user_wallet_address);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON INDEX idx_chatbot_sessions_wallet_unique IS 'Ensures one session per wallet address';

