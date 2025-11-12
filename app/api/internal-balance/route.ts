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

    // Debug logging
    console.log("[api:internal-balance] Request received:", {
      hasSession: !!session,
      userId: session?.user?.id,
      walletAddress: session?.user?.walletAddress,
      authType: session?.user?.authType,
      walletParam,
    });

    if (walletParam) {
      if (!isValidWalletAddress(walletParam)) {
        return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
      }
      normalizedWallet = walletParam.toLowerCase();
    }

    if (!userId && normalizedWallet) {
      try {
        console.log("[api:internal-balance] Fetching user by wallet:", normalizedWallet);
        const walletUser = await getUserByWalletAddress(normalizedWallet as `0x${string}`);
        if (!walletUser) {
          console.log("[api:internal-balance] User not found for wallet:", normalizedWallet);
          return NextResponse.json(
            { error: "Wallet is not registered in the system" },
            { status: 404 },
          );
        }
        userId = walletUser.id;
        console.log("[api:internal-balance] User found:", userId);
      } catch (dbError) {
        console.error("[api:internal-balance] Database error when fetching user:", dbError);
        console.error("[api:internal-balance] Error details:", {
          error: dbError instanceof Error ? dbError.message : String(dbError),
          stack: dbError instanceof Error ? dbError.stack : undefined,
        });
        return NextResponse.json(
          {
            error: "Database error while fetching user",
            details: dbError instanceof Error ? dbError.message : "Unknown database error",
          },
          { status: 500 },
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required to read internal balance" },
        { status: 401 },
      );
    }

    const walletAddressForSnapshot = normalizedWallet ?? session?.user?.walletAddress ?? null;

    console.log("[api:internal-balance] Loading snapshot:", {
      userId,
      walletAddress: walletAddressForSnapshot,
    });

    try {
      const snapshot = await getInternalBalanceSnapshot({
        userId,
        walletAddress: walletAddressForSnapshot,
      });

      console.log("[api:internal-balance] Snapshot loaded successfully:", {
        walletId: snapshot.wallet.id,
        balance: snapshot.balance.balance,
        ledgerEntries: snapshot.ledger.length,
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
    } catch (snapshotError) {
      console.error("[api:internal-balance] Failed to load balance snapshot:", snapshotError);
      console.error("[api:internal-balance] Error details:", {
        userId,
        walletAddress: walletAddressForSnapshot,
        errorMessage: snapshotError instanceof Error ? snapshotError.message : String(snapshotError),
        errorStack: snapshotError instanceof Error ? snapshotError.stack : undefined,
      });
      return NextResponse.json(
        {
          error: "Failed to load internal balance snapshot",
          details:
            snapshotError instanceof Error
              ? snapshotError.message
              : "Unknown error occurred",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[api:internal-balance] Unexpected error:", error);
    console.error("[api:internal-balance] Error stack:", error instanceof Error ? error.stack : undefined);
    return NextResponse.json(
      {
        error: "Failed to load internal balance snapshot",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
