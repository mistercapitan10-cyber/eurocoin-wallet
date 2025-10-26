import { config } from "dotenv";
import { resolve } from "path";
import { initializeDatabase } from "@/lib/database/init";
import { closePool } from "@/lib/database/db";

// Load environment variables from .env.local first, then .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function initDatabase() {
  try {
    console.log("Initializing database schema...");
    await initializeDatabase();
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

initDatabase();
