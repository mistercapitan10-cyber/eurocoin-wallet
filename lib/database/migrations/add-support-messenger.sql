-- Migration: Add Support Messenger Tables
-- Description: Creates tables for support messaging system with admin chat functionality
-- Date: 2025-01-30

-- ============================================
-- 1. Create support_messages table
-- ============================================
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
  user_wallet_address VARCHAR(42) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('user', 'admin', 'system')),
  text TEXT NOT NULL,
  admin_id BIGINT, -- Telegram chat_id админа
  admin_username VARCHAR(255), -- Имя админа из Telegram
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для support_messages
CREATE INDEX IF NOT EXISTS idx_support_messages_session ON support_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_wallet ON support_messages(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_unread ON support_messages(user_wallet_address, is_read) WHERE is_read = FALSE;

-- ============================================
-- 2. Create typing_indicators table
-- ============================================
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet_address VARCHAR(42) NOT NULL,
  admin_id BIGINT NOT NULL,
  admin_username VARCHAR(255),
  is_typing BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 seconds'
);

-- Индексы для typing_indicators
CREATE INDEX IF NOT EXISTS idx_typing_indicators_wallet ON typing_indicators(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires ON typing_indicators(expires_at);

-- ============================================
-- 3. Extend chatbot_sessions table
-- ============================================
ALTER TABLE chatbot_sessions ADD COLUMN IF NOT EXISTS last_admin_message_at TIMESTAMP;
ALTER TABLE chatbot_sessions ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- ============================================
-- 4. Function to cleanup expired typing indicators
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Function to get support message statistics
-- ============================================
CREATE OR REPLACE FUNCTION get_support_message_stats(wallet_addr VARCHAR)
RETURNS TABLE (
  total_messages BIGINT,
  unread_messages BIGINT,
  last_message_at TIMESTAMP,
  last_admin_message_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_messages,
    COUNT(*) FILTER (WHERE is_read = FALSE AND type = 'admin')::BIGINT as unread_messages,
    MAX(created_at) as last_message_at,
    MAX(created_at) FILTER (WHERE type = 'admin') as last_admin_message_at
  FROM support_messages
  WHERE user_wallet_address = wallet_addr;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Trigger to update chatbot_sessions unread count
-- ============================================
CREATE OR REPLACE FUNCTION update_session_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'admin' AND NEW.is_read = FALSE THEN
    UPDATE chatbot_sessions
    SET unread_count = unread_count + 1,
        last_admin_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.session_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_unread_count ON support_messages;
CREATE TRIGGER trigger_update_unread_count
  AFTER INSERT ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_unread_count();

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE support_messages IS 'Stores support chat messages between users and admins';
COMMENT ON TABLE typing_indicators IS 'Tracks real-time typing status of admins (auto-expires after 30s)';
COMMENT ON COLUMN chatbot_sessions.last_admin_message_at IS 'Timestamp of last admin message in support chat';
COMMENT ON COLUMN chatbot_sessions.unread_count IS 'Number of unread admin messages';
