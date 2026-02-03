/**
 * Verify user_id columns and foreign keys for requests tables
 *
 * Run:
 *  npx tsx scripts/verify-user-id-migration.ts
 *  npx tsx scripts/verify-user-id-migration.ts --apply
 */

import { readFileSync } from "fs";
import { join } from "path";
import { Pool, PoolClient } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const shouldApplyFix = process.argv.includes("--apply");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface ColumnStatus {
  table: string;
  column: string;
  exists: boolean;
}

interface ConstraintStatus {
  table: string;
  expected: string;
  ok: boolean;
  found: string[];
}

async function checkColumn(
  client: PoolClient,
  table: string,
  column: string,
): Promise<ColumnStatus> {
  const result = await client.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_name = $1
       AND column_name = $2`,
    [table, column],
  );

  return { table, column, exists: result.rows.length > 0 };
}

async function checkForeignKey(
  client: PoolClient,
  table: string,
  expected: string,
): Promise<ConstraintStatus> {
  const result = await client.query(
    `SELECT pg_get_constraintdef(oid) AS definition
     FROM pg_constraint
     WHERE conrelid = $1::regclass
       AND contype = 'f'`,
    [table],
  );

  const definitions = result.rows.map((row) => row.definition as string);
  const ok = definitions.some((definition) => definition.replace(/\s+/g, " ").includes(expected));

  return {
    table,
    expected,
    ok,
    found: definitions,
  };
}

async function applyFix(client: PoolClient) {
  const migrationPath = join(process.cwd(), "lib/database/migrations/verify-user-id-columns.sql");
  const migrationSql = readFileSync(migrationPath, "utf-8");

  console.log("📝 Applying migration:", migrationPath);

  await client.query("BEGIN");
  try {
    await client.query(migrationSql);
    await client.query("COMMIT");
    console.log("✅ Migration applied successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed, rolled back");
    throw error;
  }
}

async function run() {
  console.log("🔎 Verifying user_id columns and foreign keys...\n");

  const client = await pool.connect();

  try {
    const columnChecks = await Promise.all([
      checkColumn(client, "exchange_requests", "user_id"),
      checkColumn(client, "internal_requests", "user_id"),
    ]);

    columnChecks.forEach((check) => {
      console.log(
        `${check.exists ? "✅" : "❌"} ${check.table}.${check.column} ${
          check.exists ? "exists" : "missing"
        }`,
      );
    });

    const fkChecks = await Promise.all([
      checkForeignKey(
        client,
        "exchange_requests",
        "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
      ),
      checkForeignKey(
        client,
        "internal_requests",
        "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
      ),
    ]);

    fkChecks.forEach((check) => {
      console.log(
        `${check.ok ? "✅" : "❌"} ${check.table} user_id foreign key ${
          check.ok ? "valid" : "missing/incorrect"
        }`,
      );
      if (!check.ok && check.found.length > 0) {
        console.log("   Found:", check.found.join(" | "));
      }
    });

    const hasIssues =
      columnChecks.some((check) => !check.exists) || fkChecks.some((check) => !check.ok);

    if (hasIssues) {
      console.log("\n⚠️  Issues detected in user_id setup.");

      if (shouldApplyFix) {
        console.log("\n🛠  --apply flag provided. Applying fix...\n");
        await applyFix(client);
      } else {
        console.log("\nℹ️  Run with --apply to fix automatically.");
      }
    } else {
      console.log("\n✅ All checks passed. No action required.");
    }
  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
