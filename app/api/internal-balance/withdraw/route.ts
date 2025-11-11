import { NextRequest, NextResponse } from "next/server";
import { parseUnits, formatUnits } from "viem";
import { auth } from "@/lib/auth";
import {
  createWithdrawRequestRecord,
  listWithdrawRequests,
  type WithdrawRequestRecord,
  getWithdrawVolumeSince,
} from "@/lib/database/internal-balance-queries";
import { getUserByWalletAddress } from "@/lib/database/user-queries";
import { isValidWalletAddress, notifyNewWithdrawRequest } from "@/lib/telegram/notify-admin";
import { TOKEN_CONFIG } from "@/config/token";

const TOKEN_DECIMALS =
  Number.isFinite(TOKEN_CONFIG.decimals) && Number(TOKEN_CONFIG.decimals) > 0
    ? Number(TOKEN_CONFIG.decimals)
    : 18;

const parseLimitValue = (envName: string): bigint | null => {
  const raw = process.env[envName];
  if (!raw) return null;
  try {
    return parseUnits(raw, TOKEN_DECIMALS);
  } catch {
    console.warn(`[internal-balance] Invalid ${envName} value. Expecting numeric token amount.`);
    return null;
  }
};

const DAILY_LIMIT = parseLimitValue("INTERNAL_WITHDRAW_DAILY_LIMIT");
const MONTHLY_LIMIT = parseLimitValue("INTERNAL_WITHDRAW_MONTHLY_LIMIT");
const BLOCKED_ADDRESSES = (process.env.TREASURY_BLOCKED_ADDRESSES || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter((value) => value.startsWith("0x") && value.length === 42);

function normalizeAddress(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.toLowerCase();
}

async function resolveUserContext(
  walletHint?: string | null,
): Promise<{ userId: string; walletAddress: string | null }> {
  const session = await auth();
  let walletAddress = normalizeAddress(session?.user?.walletAddress);
  let userId = session?.user?.id ?? null;

  const fallbackWallet = normalizeAddress(walletHint);
  if (!walletAddress && fallbackWallet) {
    if (!isValidWalletAddress(fallbackWallet)) {
      throw new Error("INVALID_WALLET");
    }
    walletAddress = fallbackWallet;
  }

  if (!userId && walletAddress) {
    const existingUser = await getUserByWalletAddress(walletAddress as `0x${string}`);
    if (!existingUser) {
      throw new Error("USER_NOT_FOUND");
    }
    userId = existingUser.id;
  }

  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }

  return { userId, walletAddress };
}

function serializeRequest(record: WithdrawRequestRecord) {
  return {
    id: record.id,
    walletId: record.walletId,
    tokenSymbol: record.tokenSymbol,
    amount: record.amount,
    destinationAddress: record.destinationAddress,
    status: record.status,
    reviewerId: record.reviewerId,
    txHash: record.txHash,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function parseAmount(value?: unknown): bigint {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("AMOUNT_REQUIRED");
  }

  try {
    return parseUnits(value.trim(), TOKEN_DECIMALS);
  } catch {
    throw new Error("INVALID_AMOUNT_FORMAT");
  }
}

export async function GET(request: NextRequest) {
  try {
    const walletHint = request.nextUrl.searchParams.get("walletAddress");
    const { userId, walletAddress } = await resolveUserContext(walletHint);

    const requests = await listWithdrawRequests({
      userId,
      walletAddress,
    });

    return NextResponse.json({
      requests: requests.map(serializeRequest),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      message === "AUTH_REQUIRED" ? 401 : message === "INVALID_WALLET" ? 400 : 500;
    return NextResponse.json(
      { error: message === "UNKNOWN" ? "Failed to load withdraw requests" : message },
      { status },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      amount?: string;
      destinationAddress?: string;
      note?: string;
      walletAddress?: string;
    };

    const { userId, walletAddress } = await resolveUserContext(payload.walletAddress);
    const amount = parseAmount(payload.amount);

    const destination =
      payload.destinationAddress?.trim() ||
      walletAddress ||
      payload.destinationAddress ||
      null;

    if (!destination || !isValidWalletAddress(destination)) {
      return NextResponse.json({ error: "DESTINATION_INVALID" }, { status: 400 });
    }

    if (BLOCKED_ADDRESSES.includes(destination.toLowerCase())) {
      return NextResponse.json({ error: "DESTINATION_BLOCKED" }, { status: 403 });
    }

    const now = new Date();
    if (DAILY_LIMIT) {
      const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
      const dayVolume = await getWithdrawVolumeSince(userId, dayStart);
      if (dayVolume + amount > DAILY_LIMIT) {
        return NextResponse.json({ error: "LIMIT_DAILY_EXCEEDED" }, { status: 403 });
      }
    }

    if (MONTHLY_LIMIT) {
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
      const monthVolume = await getWithdrawVolumeSince(userId, monthStart);
      if (monthVolume + amount > MONTHLY_LIMIT) {
        return NextResponse.json({ error: "LIMIT_MONTHLY_EXCEEDED" }, { status: 403 });
      }
    }

    const creation = await createWithdrawRequestRecord({
      userId,
      walletAddress,
      amount,
      destinationAddress: destination,
      note: payload.note?.trim() || null,
    });

    void notifyNewWithdrawRequest({
      id: creation.request.id,
      walletAddress: creation.wallet.walletAddress ?? "—",
      destinationAddress: destination,
      amount: formatUnits(amount, TOKEN_DECIMALS),
      tokenSymbol: creation.request.tokenSymbol,
    }).catch(() => {});

    return NextResponse.json({
      request: serializeRequest(creation.request),
      balance: {
        ...creation.balance,
        createdAt: creation.balance.createdAt.toISOString(),
        updatedAt: creation.balance.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    const statusMap: Record<string, number> = {
      AUTH_REQUIRED: 401,
      USER_NOT_FOUND: 404,
      INVALID_WALLET: 400,
      AMOUNT_REQUIRED: 400,
      INVALID_AMOUNT_FORMAT: 400,
      INSUFFICIENT_FUNDS: 409,
    };
    const status = statusMap[message] ?? 500;

    return NextResponse.json(
      { error: message === "UNKNOWN" ? "Failed to create withdraw request" : message },
      { status },
    );
  }
}
