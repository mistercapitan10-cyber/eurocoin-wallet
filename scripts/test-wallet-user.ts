import { randomBytes } from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const [{ upsertWalletUser, getUserByWalletAddress }, { db }, { users }, { eq }] =
    await Promise.all([
      import("../lib/database/user-queries"),
      import("../lib/database/drizzle"),
      import("../lib/database/auth-schema"),
      import("drizzle-orm"),
    ]);

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Update your environment variables before testing.");
  }

  const walletAddress = `0x${randomBytes(20).toString("hex")}` as `0x${string}`;
  console.log("🔍 Testing wallet user persistence for", walletAddress);

  const initialInsert = await upsertWalletUser({
    walletAddress,
    name: "Wallet Test User",
  });

  console.log("✅ Inserted wallet user:", initialInsert);

  const fetchedAfterInsert = await getUserByWalletAddress(walletAddress);
  console.log("📦 Retrieved user:", fetchedAfterInsert);

  const linkEmailResult = await upsertWalletUser({
    walletAddress,
    email: "wallet-user@example.com",
    name: "Wallet Test User Linked",
  });

  console.log("🔗 Linked email to wallet user:", linkEmailResult);

  const fetchedAfterLink = await getUserByWalletAddress(walletAddress);
  console.log("📫 Retrieved user after linking email:", fetchedAfterLink);

  await db.delete(users).where(eq(users.id, initialInsert.id));
  console.log("🧹 Cleaned up test user");
}

main()
  .then(() => {
    console.log("🎉 Wallet user persistence test completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Wallet user persistence test failed:", error);
    process.exit(1);
  });

