import { query } from "./db";
import fs from "fs";
import path from "path";

export async function initializeDatabase() {
  try {
    console.log("Initializing database schema...");

    // Read schema file
    const schemaPath = path.join(process.cwd(), "lib/database/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    // Execute schema
    await query(schema);

    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database schema:", error);
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
