import { NextRequest, NextResponse } from "next/server";
import { upsertWalletUser } from "@/lib/database/user-queries";

type WalletAddress = `0x${string}`;

function isValidWalletAddress(value: unknown): value is WalletAddress {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function normalizeWalletAddress(value: WalletAddress): WalletAddress {
  return value as WalletAddress;
}

function sanitizeEmail(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : undefined;
}

function sanitizeName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const walletAddressRaw = (payload as { walletAddress?: unknown }).walletAddress;

  if (!isValidWalletAddress(walletAddressRaw)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const walletAddress = normalizeWalletAddress(walletAddressRaw);
  const email = sanitizeEmail((payload as { email?: unknown }).email);
  const name = sanitizeName((payload as { name?: unknown }).name);

  if ((payload as { email?: unknown }).email && !email) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  try {
    const result = await upsertWalletUser({
      walletAddress,
      email,
      name,
    });

    return NextResponse.json({
      success: true,
      userId: result.id,
      isNewUser: result.isNewUser,
      linkedExistingAccount: result.linkedExistingAccount,
    });
  } catch (error) {
    console.error("[api:user:register-wallet] Failed to upsert wallet user:", error);
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }
}

