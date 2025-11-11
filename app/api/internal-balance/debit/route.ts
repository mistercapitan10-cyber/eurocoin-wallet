import { NextRequest, NextResponse } from "next/server";
import { parseUnits } from "viem";
import {
  debitInternalBalance,
  getInternalBalanceSnapshot,
} from "@/lib/database/internal-balance-queries";
import { getUserByWalletAddress } from "@/lib/database/user-queries";
import { isValidWalletAddress } from "@/lib/telegram/notify-admin";
import { TOKEN_CONFIG } from "@/config/token";

const DEFAULT_DECIMALS =
  Number.isFinite(TOKEN_CONFIG.decimals) && Number(TOKEN_CONFIG.decimals) > 0
    ? Number(TOKEN_CONFIG.decimals)
    : 18;

interface AdminBalancePayload {
  userId?: string;
  walletAddress?: string;
  amount?: string;
  amountMinor?: string;
  tokenSymbol?: string;
  reference?: string;
  metadata?: Record<string, unknown> | null;
  createdBy?: string;
}

function ensureAdminSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.INTERNAL_BALANCE_SIGNING_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INTERNAL_BALANCE_SIGNING_SECRET is not configured" },
      { status: 503 },
    );
  }

  const provided = request.headers.get("x-internal-admin-token");
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
  }

  return null;
}

function parseAmount(payload: AdminBalancePayload): bigint {
  if (payload.amountMinor) {
    try {
      return BigInt(payload.amountMinor);
    } catch {
      throw new Error("Invalid amountMinor value");
    }
  }

  if (!payload.amount) {
    throw new Error("amount or amountMinor is required");
  }

  try {
    return parseUnits(payload.amount, DEFAULT_DECIMALS);
  } catch (error) {
    console.error("[api:internal-balance:debit] Failed to parse amount:", error);
    throw new Error("Invalid amount format");
  }
}

function sanitizeMetadata(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

async function resolveUserIdentifier(
  payload: AdminBalancePayload,
): Promise<{ userId: string; walletAddress?: string | null }> {
  if (payload.userId) {
    return {
      userId: payload.userId,
      walletAddress: payload.walletAddress ? payload.walletAddress.toLowerCase() : null,
    };
  }

  if (!payload.walletAddress) {
    throw new Error("userId or walletAddress is required");
  }

  if (!isValidWalletAddress(payload.walletAddress)) {
    throw new Error("Invalid wallet address");
  }

  const walletUser = await getUserByWalletAddress(payload.walletAddress as `0x${string}`);
  if (!walletUser) {
    throw new Error("Wallet address is not registered");
  }

  return {
    userId: walletUser.id,
    walletAddress: payload.walletAddress.toLowerCase(),
  };
}

export async function POST(request: NextRequest) {
  const authError = ensureAdminSecret(request);
  if (authError) {
    return authError;
  }

  let payload: AdminBalancePayload;
  try {
    payload = (await request.json()) as AdminBalancePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const { userId, walletAddress } = await resolveUserIdentifier(payload);
    const amount = parseAmount(payload);

    const mutation = await debitInternalBalance({
      userId,
      walletAddress,
      amount,
      tokenSymbol: payload.tokenSymbol,
      reference: payload.reference,
      metadata: sanitizeMetadata(payload.metadata ?? null),
      createdBy: payload.createdBy ?? "system",
    });

    const snapshot = await getInternalBalanceSnapshot({
      userId,
      walletAddress,
    });

    return NextResponse.json({
      tokenSymbol: snapshot.tokenSymbol,
      decimals: snapshot.decimals,
      wallet: snapshot.wallet,
      balance: snapshot.balance,
      ledger: snapshot.ledger,
      lastEntry: mutation.ledgerEntry,
    });
  } catch (error) {
    console.error("[api:internal-balance:debit] Failed to debit balance:", error);
    const message =
      error instanceof Error ? error.message : "Failed to debit internal balance for this user";
    const status = message === "INSUFFICIENT_FUNDS" ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
