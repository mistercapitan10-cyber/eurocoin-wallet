import { config } from "dotenv";
import { resolve } from "path";
import crypto from "crypto";
import {
  creditInternalBalance,
  createWithdrawRequestRecord,
  getInternalBalanceSnapshot,
  updateWithdrawRequestStatus,
} from "@/lib/database/internal-balance-queries";
import { query, closePool } from "@/lib/database/db";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const TOKEN_DECIMALS = BigInt(18);
const TOKEN_UNIT = BigInt(10) ** TOKEN_DECIMALS;

const TEST_WALLET_ADDRESS = "0x1234567890123456789012345678901234567890";

const toMinor = (tokens: number): bigint => BigInt(tokens) * TOKEN_UNIT;

async function ensureTables(): Promise<void> {
  const result = await query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_name IN ('internal_wallets', 'internal_balances', 'internal_ledger', 'withdraw_requests')`,
  );

  const tables = new Set(result.rows.map((row) => row.table_name));
  const required = [
    "internal_wallets",
    "internal_balances",
    "internal_ledger",
    "withdraw_requests",
  ];

  const missing = required.filter((name) => !tables.has(name));
  if (missing.length > 0) {
    throw new Error(`Missing required tables: ${missing.join(", ")}`);
  }
}

async function getBalance(userId: string) {
  const snapshot = await getInternalBalanceSnapshot({
    userId,
    walletAddress: TEST_WALLET_ADDRESS,
  });
  return snapshot.balance;
}

async function getPending(userId: string): Promise<bigint> {
  const balance = await getBalance(userId);
  return BigInt(balance.pendingOnchain);
}

async function getTotal(userId: string): Promise<bigint> {
  const balance = await getBalance(userId);
  return BigInt(balance.balance);
}

async function getLedgerCount(userId: string, entryType: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) AS count
     FROM internal_ledger il
     JOIN internal_wallets iw ON iw.id = il.wallet_id
     WHERE iw.user_id = $1 AND il.entry_type = $2`,
    [userId, entryType],
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function cleanup(userId: string) {
  await query(
    `DELETE FROM internal_ledger
     WHERE wallet_id IN (SELECT id FROM internal_wallets WHERE user_id = $1)`,
    [userId],
  );
  await query(
    `DELETE FROM withdraw_requests
     WHERE wallet_id IN (SELECT id FROM internal_wallets WHERE user_id = $1)`,
    [userId],
  );
  await query(
    `DELETE FROM internal_balances
     WHERE wallet_id IN (SELECT id FROM internal_wallets WHERE user_id = $1)`,
    [userId],
  );
  await query("DELETE FROM internal_wallets WHERE user_id = $1", [userId]);
}

async function run() {
  console.log("\n=== Withdraw Flow Tests ===\n");

  const userId = crypto.randomUUID();

  try {
    await ensureTables();
    console.log("✓ Required tables exist\n");

    const initialAmount = toMinor(10);
    console.log("1. Credit internal balance...");
    await creditInternalBalance({
      userId,
      walletAddress: TEST_WALLET_ADDRESS,
      amount: initialAmount,
      reference: "withdraw-flow-test",
      createdBy: "test-suite",
    });

    const totalAfterCredit = await getTotal(userId);
    if (totalAfterCredit !== initialAmount) {
      throw new Error("Balance credit failed: total mismatch");
    }
    console.log("✓ Balance credited\n");

    const withdrawAmount = toMinor(4);
    console.log("2. Create withdraw request...");
    const created = await createWithdrawRequestRecord({
      userId,
      walletAddress: TEST_WALLET_ADDRESS,
      destinationAddress: TEST_WALLET_ADDRESS,
      amount: withdrawAmount,
    });

    const pendingAfterCreate = await getPending(userId);
    if (pendingAfterCreate !== withdrawAmount) {
      throw new Error("Pending balance not reserved after create");
    }
    console.log("✓ Request created and pending reserved\n");

    console.log("3. Approve withdraw request (balance should be debited)...");
    await updateWithdrawRequestStatus({
      requestId: created.request.id,
      status: "approved",
      reviewerId: null,
    });

    const totalAfterApprove = await getTotal(userId);
    const pendingAfterApprove = await getPending(userId);
    if (pendingAfterApprove !== BigInt(0)) {
      throw new Error("Pending balance not released after approval");
    }
    if (totalAfterApprove !== initialAmount - withdrawAmount) {
      throw new Error("Balance not debited on approval");
    }
    console.log("✓ Approved and debited\n");

    console.log("4. Processing -> completed should not double debit...");
    await updateWithdrawRequestStatus({
      requestId: created.request.id,
      status: "processing",
      reviewerId: null,
    });

    await updateWithdrawRequestStatus({
      requestId: created.request.id,
      status: "completed",
      reviewerId: null,
      txHash: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    });

    const totalAfterCompleted = await getTotal(userId);
    if (totalAfterCompleted !== totalAfterApprove) {
      throw new Error("Balance changed on completed status");
    }
    console.log("✓ Completed without double debit\n");

    console.log("5. Failed after processing should refund...");
    const failedRequest = await createWithdrawRequestRecord({
      userId,
      walletAddress: TEST_WALLET_ADDRESS,
      destinationAddress: TEST_WALLET_ADDRESS,
      amount: toMinor(2),
    });

    await updateWithdrawRequestStatus({
      requestId: failedRequest.request.id,
      status: "approved",
      reviewerId: null,
    });

    await updateWithdrawRequestStatus({
      requestId: failedRequest.request.id,
      status: "processing",
      reviewerId: null,
    });

    await updateWithdrawRequestStatus({
      requestId: failedRequest.request.id,
      status: "failed",
      reviewerId: null,
    });

    const totalAfterFailed = await getTotal(userId);
    if (totalAfterFailed !== totalAfterCompleted) {
      throw new Error("Balance not refunded after failed status");
    }

    const refundCount = await getLedgerCount(userId, "refund");
    if (refundCount === 0) {
      throw new Error("Refund ledger entry not created");
    }
    console.log("✓ Failed status refunded and ledger recorded\n");

    console.log("6. Reject after approval should be blocked...");
    const invalidRequest = await createWithdrawRequestRecord({
      userId,
      walletAddress: TEST_WALLET_ADDRESS,
      destinationAddress: TEST_WALLET_ADDRESS,
      amount: toMinor(1),
    });

    await updateWithdrawRequestStatus({
      requestId: invalidRequest.request.id,
      status: "approved",
      reviewerId: null,
    });

    let rejected = false;
    try {
      await updateWithdrawRequestStatus({
        requestId: invalidRequest.request.id,
        status: "rejected",
        reviewerId: null,
      });
      rejected = true;
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "USE_FAILED_STATUS_AFTER_APPROVED") {
        throw error;
      }
    }

    if (rejected) {
      throw new Error("Reject was allowed after approval");
    }
    console.log("✓ Reject blocked after approval\n");

    console.log("=== All withdraw flow tests passed ===\n");
  } catch (error) {
    console.error("\n✗ Withdraw flow test failed:", error);
    process.exitCode = 1;
  } finally {
    await cleanup(userId).catch(() => {});
    await closePool();
  }
}

run();
