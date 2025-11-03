/**
 * Fix userId column names migration
 * Renames user_id to userId in accounts and sessions tables
 *
 * Run: npx tsx scripts/fix-userid-columns.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function applyFix() {
  console.log("🚀 Starting userId column name fix migration...\n");

  try {
    // Read SQL migration file
    const migrationPath = join(
      process.cwd(),
      "lib/database/migrations/fix-userid-column-names.sql",
    );
    const migrationSql = readFileSync(migrationPath, "utf-8");

    console.log("📄 Reading migration from:", migrationPath);

    // Connect to database
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL database\n");

    try {
      // Check current column names
      const accountsCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name IN ('user_id', 'userId')
      `);

      const sessionsCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name IN ('user_id', 'userId')
      `);

      console.log("📊 Current column names:");
      console.log("   accounts:", accountsCheck.rows.map((r) => r.column_name).join(", ") || "none");
      console.log("   sessions:", sessionsCheck.rows.map((r) => r.column_name).join(", ") || "none");
      console.log();

      // Begin transaction
      await client.query("BEGIN");
      console.log("🔄 Starting transaction...\n");

      // Execute migration SQL
      console.log("📝 Applying migration...");
      await client.query(migrationSql);

      // Commit transaction
      await client.query("COMMIT");
      console.log("✅ Transaction committed successfully!\n");

      // Verify columns were renamed
      const accountsAfter = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'userId'
      `);

      const sessionsAfter = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'userId'
      `);

      if (accountsAfter.rows.length > 0 && sessionsAfter.rows.length > 0) {
        console.log("✅ Migration completed successfully!");
        console.log("   ✓ accounts.userId exists");
        console.log("   ✓ sessions.userId exists");
      } else {
        console.log("⚠️  Migration applied, but verification failed");
        console.log("   Please check the database manually");
      }

      console.log("\n🎉 Fix completed!");
    } catch (error) {
      // Rollback on error
      await client.query("ROLLBACK");
      console.error("❌ Transaction rolled back due to error");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
applyFix();

