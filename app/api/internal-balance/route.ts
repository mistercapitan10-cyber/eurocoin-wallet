import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInternalBalanceSnapshot } from "@/lib/database/internal-balance-queries";
import { getUserByWalletAddress } from "@/lib/database/user-queries";
import { isValidWalletAddress } from "@/lib/telegram/notify-admin";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const walletParam = request.nextUrl.searchParams.get("walletAddress");
    let userId = session?.user?.id;
    let normalizedWallet: string | null = null;

    if (walletParam) {
      if (!isValidWalletAddress(walletParam)) {
        return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
      }
      normalizedWallet = walletParam.toLowerCase();
    }

    if (!userId && normalizedWallet) {
      const walletUser = await getUserByWalletAddress(normalizedWallet as `0x${string}`);
      if (!walletUser) {
        return NextResponse.json(
          { error: "Wallet is not registered in the system" },
          { status: 404 },
        );
      }
      userId = walletUser.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required to read internal balance" },
        { status: 401 },
      );
    }

    const snapshot = await getInternalBalanceSnapshot({
      userId,
      walletAddress: normalizedWallet ?? session?.user?.walletAddress,
    });

    const serializeLedger = snapshot.ledger.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    }));

    return NextResponse.json({
      tokenSymbol: snapshot.tokenSymbol,
      decimals: snapshot.decimals,
      wallet: {
        ...snapshot.wallet,
        createdAt: snapshot.wallet.createdAt.toISOString(),
        updatedAt: snapshot.wallet.updatedAt.toISOString(),
      },
      balance: {
        ...snapshot.balance,
        createdAt: snapshot.balance.createdAt.toISOString(),
        updatedAt: snapshot.balance.updatedAt.toISOString(),
      },
      ledger: serializeLedger,
    });
  } catch (error) {
    console.error("[api:internal-balance] Failed to load balance snapshot:", error);
    return NextResponse.json(
      { error: "Failed to load internal balance snapshot" },
      { status: 500 },
    );
  }
}
