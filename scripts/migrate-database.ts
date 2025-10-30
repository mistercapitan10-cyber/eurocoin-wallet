import { config } from "dotenv";
import { resolve } from "path";
import { query } from "@/lib/database/db";
import { closePool } from "@/lib/database/db";

// Load environment variables from .env.local first, then .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function applyMigration() {
  try {
    console.log("Applying database migration for exchange_requests.current_stage...");

    // Check if column exists
    const checkResult = await query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'exchange_requests' 
      AND column_name = 'current_stage'
    `);

    if (checkResult.rows.length > 0) {
      console.log("✅ Migration already applied: current_stage column exists in exchange_requests");
      return;
    }

    // Apply migration
    console.log("Adding current_stage column to exchange_requests table...");
    await query(`
      ALTER TABLE exchange_requests 
      ADD COLUMN current_stage VARCHAR(50)
    `);

    console.log("Creating index on current_stage...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_exchange_requests_stage 
      ON exchange_requests(current_stage)
    `);

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await closePool();
  }
}

applyMigration().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
