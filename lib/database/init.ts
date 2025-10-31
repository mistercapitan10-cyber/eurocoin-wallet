import { query } from "./db";
import fs from "fs";
import path from "path";

async function readMigrationFile(filename: string): Promise<string> {
  const migrationPath = path.join(process.cwd(), "lib/database/migrations", filename);
  return fs.readFileSync(migrationPath, "utf-8");
}

export async function initializeDatabase() {
  try {
    console.log("Initializing database schema...");

    // Read schema file
    const schemaPath = path.join(process.cwd(), "lib/database/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    // Execute schema
    await query(schema);

    // Apply migrations
    await applyMigrations();

    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database schema:", error);
    throw error;
  }
}

async function applyMigrations() {
  try {
    console.log("Applying database migrations...");

    // Migration: Add current_stage column to internal_requests
    const checkInternalResult = await query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'internal_requests' 
      AND column_name = 'current_stage'
    `);

    if (checkInternalResult.rows.length === 0) {
      console.log("Applying migration: add_current_stage column to internal_requests");

      await query(`
        ALTER TABLE internal_requests 
        ADD COLUMN current_stage VARCHAR(50)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_internal_requests_stage 
        ON internal_requests(current_stage)
      `);

      console.log("✅ Migration completed: current_stage column added to internal_requests");
    } else {
      console.log("✅ Migration already applied: current_stage column exists in internal_requests");
    }

    // Migration: Add current_stage column to exchange_requests
    const checkExchangeResult = await query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'exchange_requests' 
      AND column_name = 'current_stage'
    `);

    if (checkExchangeResult.rows.length === 0) {
      console.log("Applying migration: add_current_stage column to exchange_requests");

      await query(`
        ALTER TABLE exchange_requests 
        ADD COLUMN current_stage VARCHAR(50)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_exchange_requests_stage 
        ON exchange_requests(current_stage)
      `);

      console.log("✅ Migration completed: current_stage column added to exchange_requests");
    } else {
      console.log("✅ Migration already applied: current_stage column exists in exchange_requests");
    }

    // Migration: Add support messenger tables
    const checkSupportMessagesResult = await query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'support_messages'
    `);

    if (checkSupportMessagesResult.rows.length === 0) {
      console.log("Applying migration: add-support-messenger tables");

      const supportMessengerMigration = await readMigrationFile("add-support-messenger.sql");
      await query(supportMessengerMigration);

      console.log("✅ Migration completed: support messenger tables created");
    } else {
      console.log("✅ Migration already applied: support messenger tables exist");
    }

    // Migration: Add unique constraint to chatbot_sessions
    const checkUniqueIndexResult = await query(`
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'chatbot_sessions' 
      AND indexname = 'idx_chatbot_sessions_wallet_unique'
    `);

    if (checkUniqueIndexResult.rows.length === 0) {
      console.log("Applying migration: add unique constraint to chatbot_sessions");

      const uniqueWalletMigration = await readMigrationFile("add-unique-wallet-to-sessions.sql");
      await query(uniqueWalletMigration);

      console.log("✅ Migration completed: unique constraint added to chatbot_sessions");
    } else {
      console.log("✅ Migration already applied: unique constraint exists in chatbot_sessions");
    }

    // Migration: Add request_files table
    const checkRequestFilesResult = await query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'request_files'
    `);

    if (checkRequestFilesResult.rows.length === 0) {
      console.log("Applying migration: add request_files table");

      const requestFilesMigration = await readMigrationFile("add-request-files.sql");
      await query(requestFilesMigration);

      console.log("✅ Migration completed: request_files table created");
    } else {
      console.log("✅ Migration already applied: request_files table exists");
    }
  } catch (error) {
    console.error("Failed to apply migrations:", error);
    throw error;
  }
}

export async function dropDatabase() {
  try {
    console.log("Dropping database tables...");

    // Drop triggers and function
    await query(`
      DROP TRIGGER IF EXISTS update_exchange_requests_updated_at ON exchange_requests;
      DROP TRIGGER IF EXISTS update_internal_requests_updated_at ON internal_requests;
      DROP FUNCTION IF EXISTS update_updated_at_column();
    `);

    // Drop tables
    await query("DROP TABLE IF EXISTS exchange_requests CASCADE");
    await query("DROP TABLE IF EXISTS internal_requests CASCADE");

    console.log("Database tables dropped successfully");
  } catch (error) {
    console.error("Failed to drop database tables:", error);
    throw error;
  }
}
