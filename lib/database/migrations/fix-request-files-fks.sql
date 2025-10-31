-- Fix foreign key constraints for request_files table
-- The issue: Both FK constraints are always checked, but we need conditional checking
-- Solution: Remove FKs since they can't be conditional in PostgreSQL
-- We rely on application logic to ensure referential integrity

-- Drop existing constraints
ALTER TABLE request_files 
  DROP CONSTRAINT IF EXISTS fk_exchange_request;

ALTER TABLE request_files 
  DROP CONSTRAINT IF EXISTS fk_internal_request;

-- Note: CASCADE DELETE logic is handled in application layer
-- via ON DELETE CASCADE in the application queries
