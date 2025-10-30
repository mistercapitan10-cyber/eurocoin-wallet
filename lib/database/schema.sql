-- Exchange Requests Table
CREATE TABLE IF NOT EXISTS exchange_requests (
  id VARCHAR(50) PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  token_amount VARCHAR(50) NOT NULL,
  fiat_amount VARCHAR(50) NOT NULL,
  rate VARCHAR(100) NOT NULL,
  commission VARCHAR(50) NOT NULL,
  comment TEXT,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  current_stage VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exchange_requests_wallet ON exchange_requests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_status ON exchange_requests(status);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_stage ON exchange_requests(current_stage);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for exchange_requests
DROP TRIGGER IF EXISTS update_exchange_requests_updated_at ON exchange_requests;
CREATE TRIGGER update_exchange_requests_updated_at
    BEFORE UPDATE ON exchange_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Internal Requests Table
CREATE TABLE IF NOT EXISTS internal_requests (
  id VARCHAR(50) PRIMARY KEY,
  wallet_address VARCHAR(255),
  requester VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  department VARCHAR(50) NOT NULL,
  request_type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  current_stage VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_internal_requests_wallet ON internal_requests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_internal_requests_status ON internal_requests(status);

-- Trigger for internal_requests
DROP TRIGGER IF EXISTS update_internal_requests_updated_at ON internal_requests;
CREATE TRIGGER update_internal_requests_updated_at
    BEFORE UPDATE ON internal_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Chatbot Sessions Table
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet_address VARCHAR(42) NOT NULL,
  telegram_chat_id BIGINT,
  locale VARCHAR(2) DEFAULT 'ru',
  is_admin_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_wallet ON chatbot_sessions(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_updated ON chatbot_sessions(updated_at DESC);

-- Chatbot Messages Table
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('user', 'bot', 'admin')),
  text TEXT NOT NULL,
  translated_text TEXT,
  is_translated BOOLEAN DEFAULT FALSE,
  is_admin_response BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_session ON chatbot_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created ON chatbot_messages(created_at);

-- Chatbot Transaction Analysis Table
CREATE TABLE IF NOT EXISTS chatbot_transaction_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
  tx_hash VARCHAR(66) NOT NULL,
  analysis_result JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chatbot_analysis_session ON chatbot_transaction_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_analysis_tx_hash ON chatbot_transaction_analysis(tx_hash);

-- Trigger for chatbot_sessions updated_at
DROP TRIGGER IF EXISTS update_chatbot_sessions_updated_at ON chatbot_sessions;
CREATE TRIGGER update_chatbot_sessions_updated_at
  BEFORE UPDATE ON chatbot_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get active chat sessions (for admin)
CREATE OR REPLACE FUNCTION get_active_chatbot_sessions()
RETURNS TABLE (
  id UUID,
  user_wallet_address VARCHAR(42),
  locale VARCHAR(2),
  is_admin_mode BOOLEAN,
  updated_at TIMESTAMP,
  last_message_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.user_wallet_address,
    cs.locale,
    cs.is_admin_mode,
    cs.updated_at,
    MAX(cm.created_at) as last_message_at
  FROM chatbot_sessions cs
  LEFT JOIN chatbot_messages cm ON cs.id = cm.session_id
  WHERE cs.updated_at > NOW() - INTERVAL '24 hours'
  GROUP BY cs.id, cs.user_wallet_address, cs.locale, cs.is_admin_mode, cs.updated_at
  ORDER BY last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;
