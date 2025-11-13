import { config } from "dotenv";
import { resolve } from "path";
import { ethers } from "ethers";
import { TOKEN_CONFIG } from "@/config/token";
import { ERC20_ABI } from "@/lib/abi/erc20";
import { closePool } from "@/lib/database/db";
import { notifyTreasuryBalanceAlert } from "@/lib/telegram/notify-admin";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const RPC_URL =
  process.env.TREASURY_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL || "";
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY || "";

// Treasury balance thresholds (in token units, not wei)
const TREASURY_BALANCE_LOW_THRESHOLD = process.env.TREASURY_BALANCE_LOW_THRESHOLD
  ? Number(process.env.TREASURY_BALANCE_LOW_THRESHOLD)
  : null;
const TREASURY_BALANCE_CRITICAL_THRESHOLD = process.env.TREASURY_BALANCE_CRITICAL_THRESHOLD
  ? Number(process.env.TREASURY_BALANCE_CRITICAL_THRESHOLD)
  : null;

const DRY_RUN = !TREASURY_PRIVATE_KEY || !RPC_URL;
const provider = !DRY_RUN ? new ethers.JsonRpcProvider(RPC_URL) : null;
const signer = !DRY_RUN && provider ? new ethers.Wallet(TREASURY_PRIVATE_KEY, provider) : null;
const tokenAddress = TOKEN_CONFIG.address;
const tokenDecimals = TOKEN_CONFIG.decimals;

async function checkTreasuryBalance() {
  if (DRY_RUN) {
    console.log("[treasury-balance-check] DRY RUN mode - skipping balance check");
    return;
  }

  if (!signer || !provider) {
    console.error("[treasury-balance-check] Signer or provider not configured");
    return;
  }

  if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
    console.error("[treasury-balance-check] Token address not configured");
    return;
  }

  try {
    const treasuryAddress = await signer.getAddress();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(treasuryAddress);
    const humanBalance = Number(ethers.formatUnits(balance, tokenDecimals));

    console.log(`[treasury-balance-check] Treasury balance: ${humanBalance} ${TOKEN_CONFIG.symbol}`);
    console.log(`[treasury-balance-check] Treasury address: ${treasuryAddress}`);

    // Check if thresholds are configured
    if (
      TREASURY_BALANCE_CRITICAL_THRESHOLD === null &&
      TREASURY_BALANCE_LOW_THRESHOLD === null
    ) {
      console.log(
        "[treasury-balance-check] No thresholds configured. Set TREASURY_BALANCE_LOW_THRESHOLD and/or TREASURY_BALANCE_CRITICAL_THRESHOLD to enable alerts.",
      );
      return;
    }

    // Check critical threshold first (most urgent)
    if (
      TREASURY_BALANCE_CRITICAL_THRESHOLD !== null &&
      humanBalance <= TREASURY_BALANCE_CRITICAL_THRESHOLD
    ) {
      console.log(
        `[treasury-balance-check] ⚠️ CRITICAL: Balance ${humanBalance} <= ${TREASURY_BALANCE_CRITICAL_THRESHOLD}`,
      );
      await notifyTreasuryBalanceAlert({
        treasuryAddress,
        currentBalance: humanBalance.toString(),
        threshold: TREASURY_BALANCE_CRITICAL_THRESHOLD.toString(),
        tokenSymbol: TOKEN_CONFIG.symbol,
        status: "critical",
      });
      return;
    }

    // Check low threshold
    if (
      TREASURY_BALANCE_LOW_THRESHOLD !== null &&
      humanBalance <= TREASURY_BALANCE_LOW_THRESHOLD
    ) {
      console.log(
        `[treasury-balance-check] ⚠️ LOW: Balance ${humanBalance} <= ${TREASURY_BALANCE_LOW_THRESHOLD}`,
      );
      await notifyTreasuryBalanceAlert({
        treasuryAddress,
        currentBalance: humanBalance.toString(),
        threshold: TREASURY_BALANCE_LOW_THRESHOLD.toString(),
        tokenSymbol: TOKEN_CONFIG.symbol,
        status: "low",
      });
      return;
    }

    console.log("[treasury-balance-check] ✅ Balance is above all thresholds");
  } catch (error) {
    console.error("[treasury-balance-check] Failed to check balance:", error);
    throw error;
  }
}

checkTreasuryBalance()
  .catch((error) => {
    console.error("[treasury-balance-check] Fatal error", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });

