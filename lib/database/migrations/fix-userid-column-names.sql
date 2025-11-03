-- Migration: Fix user_id column names to userId (camelCase)
-- This fixes the mismatch between Drizzle schema and actual database schema
-- NextAuth adapter expects camelCase column names

-- Rename user_id to userId in accounts table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN user_id TO "userId";
    RAISE NOTICE 'Renamed accounts.user_id to accounts.userId';
  ELSE
    RAISE NOTICE 'Column accounts.user_id does not exist, skipping rename';
  END IF;
END $$;

-- Rename user_id to userId in sessions table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sessions RENAME COLUMN user_id TO "userId";
    RAISE NOTICE 'Renamed sessions.user_id to sessions.userId';
  ELSE
    RAISE NOTICE 'Column sessions.user_id does not exist, skipping rename';
  END IF;
END $$;

-- Recreate indexes with new column names
DROP INDEX IF EXISTS idx_accounts_user_id;
CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts("userId");

DROP INDEX IF EXISTS idx_sessions_user_id;
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions("userId");

-- Update foreign key constraints (they should still work after rename)
-- Verify constraints are still valid
DO $$
BEGIN
  -- Check if foreign key constraint exists and is valid
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%accounts_user%' 
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE NOTICE 'Foreign key constraint on accounts.userId exists';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%sessions_user%' 
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE NOTICE 'Foreign key constraint on sessions.userId exists';
  END IF;
END $$;

