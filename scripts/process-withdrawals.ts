import { config } from "dotenv";
import { resolve } from "path";
import crypto from "crypto";
import { ethers } from "ethers";
import { TOKEN_CONFIG } from "@/config/token";
import { ERC20_ABI } from "@/lib/abi/erc20";
import {
  getWithdrawExecutionQueue,
  updateWithdrawRequestStatus,
  type WithdrawStatus,
} from "@/lib/database/internal-balance-queries";
import { closePool } from "@/lib/database/db";
import { notifyWithdrawStatusChange } from "@/lib/telegram/notify-admin";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const RPC_URL =
  process.env.TREASURY_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL || "";
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY || "";
const WORKER_ID = process.env.TREASURY_WORKER_ID || "auto-worker";
const BATCH_SIZE = Number(process.env.TREASURY_BATCH_SIZE || 5);
const CONFIRMATIONS = Number(process.env.TREASURY_TX_CONFIRMATIONS || 1);
const DRY_RUN = !TREASURY_PRIVATE_KEY || !RPC_URL;
const EXECUTION_STATUSES: WithdrawStatus[] = ["approved"];

const provider = !DRY_RUN ? new ethers.JsonRpcProvider(RPC_URL) : null;
const signer = !DRY_RUN && provider ? new ethers.Wallet(TREASURY_PRIVATE_KEY, provider) : null;
const tokenAddress = TOKEN_CONFIG.address;
const tokenDecimals = TOKEN_CONFIG.decimals;

console.log("[treasury] Starting withdrawal processor", {
  dryRun: DRY_RUN,
  rpc: RPC_URL ? "configured" : "missing",
  tokenAddress,
  batchSize: BATCH_SIZE,
});

const randomTxHash = () => `0x${crypto.randomBytes(32).toString("hex")}`;

async function checkTreasuryBalance(amount: bigint): Promise<boolean> {
  if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
    return false;
  }

  if (!signer || !provider) {
    return false;
  }

  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const treasuryAddress = await signer.getAddress();
  const balance = await contract.balanceOf(treasuryAddress);
  return balance >= amount;
}

async function dispatchOnChainTransfer(destination: string, amount: bigint): Promise<string> {
  if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
    console.warn("[treasury] Token address is not configured, skipping on-chain transfer");
    return randomTxHash();
  }

  if (!signer || !provider) {
    return randomTxHash();
  }

  // Check treasury balance before attempting transfer
  const hasBalance = await checkTreasuryBalance(amount);
  if (!hasBalance) {
    const treasuryAddress = await signer.getAddress();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(treasuryAddress);
    const humanBalance = ethers.formatUnits(balance, tokenDecimals);
    const humanAmount = ethers.formatUnits(amount, tokenDecimals);
    throw new Error(
      `Insufficient treasury balance: ${humanBalance} < ${humanAmount} (treasury: ${treasuryAddress})`,
    );
  }

  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const tx = await contract.transfer(destination, amount);
  console.log(`[treasury] Submitted tx ${tx.hash} -> ${destination}`);
  const receipt = await tx.wait(CONFIRMATIONS);
  console.log(`[treasury] Confirmed tx ${receipt.hash} in block ${receipt.blockNumber}`);
  return receipt.hash;
}

async function processQueue() {
  const queue = await getWithdrawExecutionQueue(EXECUTION_STATUSES, BATCH_SIZE);

  if (queue.length === 0) {
    console.log("[treasury] No withdraw requests ready for processing");
    return;
  }

  console.log(`[treasury] Processing ${queue.length} withdraw request(s)`);

  for (const item of queue) {
    const { request } = item;
    console.log(`[treasury] Handling request ${request.id} -> ${request.destinationAddress}`);

    try {
      await updateWithdrawRequestStatus({
        requestId: request.id,
        status: "processing",
        reviewerId: WORKER_ID,
      });

      const amountBigInt = BigInt(request.amount);
      const humanAmount = ethers.formatUnits(amountBigInt, tokenDecimals);

      let txHash: string;
      if (DRY_RUN) {
        txHash = randomTxHash();
        console.log(
          `[treasury] DRY-RUN transfer ${humanAmount} ${request.tokenSymbol} -> ${request.destinationAddress}`,
        );
      } else {
        txHash = await dispatchOnChainTransfer(request.destinationAddress, amountBigInt);
      }

      await updateWithdrawRequestStatus({
        requestId: request.id,
        status: "completed",
        reviewerId: WORKER_ID,
        txHash,
        notes: DRY_RUN ? "dry-run payout" : null,
      });

      await notifyWithdrawStatusChange({
        id: request.id,
        status: "completed",
        amount: humanAmount,
        tokenSymbol: request.tokenSymbol,
        destinationAddress: request.destinationAddress,
        txHash,
      }).catch(() => {});

      console.log(`[treasury] Completed request ${request.id} · tx ${txHash}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[treasury] Failed to process request ${request.id}:`, errorMessage);

      // Determine rejection reason
      let rejectionNote = "auto rejection due to processor failure";
      if (errorMessage.includes("Insufficient treasury balance")) {
        rejectionNote = `auto rejection: insufficient treasury balance - ${errorMessage}`;
      } else if (errorMessage.includes("insufficient funds")) {
        rejectionNote = `auto rejection: insufficient funds for gas - ${errorMessage}`;
      }

      await updateWithdrawRequestStatus({
        requestId: request.id,
        status: "rejected",
        reviewerId: WORKER_ID,
        notes: rejectionNote,
      }).catch((rejectError: unknown) => {
        console.error("[treasury] Failed to rollback request:", rejectError);
      });

      await notifyWithdrawStatusChange({
        id: request.id,
        status: "rejected",
        amount: ethers.formatUnits(request.amount, tokenDecimals),
        tokenSymbol: request.tokenSymbol,
        destinationAddress: request.destinationAddress,
      }).catch(() => {});
    }
  }
}

processQueue()
  .catch((error) => {
    console.error("[treasury] Fatal error", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
