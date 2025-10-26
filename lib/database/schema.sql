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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exchange_requests_wallet ON exchange_requests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_status ON exchange_requests(status);

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
