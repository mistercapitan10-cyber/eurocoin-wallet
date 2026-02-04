import { config } from "dotenv";
import { resolve } from "path";
import crypto from "crypto";
import { query, closePool } from "@/lib/database/db";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const walletAddress =
  process.env.TEST_WALLET_ADDRESS || "0x1234567890123456789012345678901234567890";

async function seed() {
  try {
    const normalized = walletAddress.toLowerCase();
    const existing = await query("SELECT id FROM users WHERE LOWER(wallet_address) = $1 LIMIT 1", [
      normalized,
    ]);

    if (existing.rows.length > 0) {
      console.log("✅ Test user already exists");
      return;
    }

    const userId = crypto.randomUUID();
    const email = `test-${userId.slice(0, 8)}@example.com`;

    await query(
      `INSERT INTO users (id, email, auth_type, wallet_address, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, email, "wallet", normalized],
    );

    console.log("✅ Test user created", { userId, walletAddress: normalized });
  } finally {
    await closePool();
  }
}

seed().catch((error) => {
  console.error("❌ Failed to seed test user:", error);
  process.exit(1);
});
