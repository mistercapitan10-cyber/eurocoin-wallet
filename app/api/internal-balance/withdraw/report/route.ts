import { NextRequest, NextResponse } from "next/server";
import { getWithdrawReport } from "@/lib/database/internal-balance-queries";

function ensureAdminToken(request: NextRequest): NextResponse | null {
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

export async function GET(request: NextRequest) {
  const authError = ensureAdminToken(request);
  if (authError) {
    return authError;
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "1000");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 5000) : 1000;

  const data = await getWithdrawReport(limit);

  const csvHeader = [
    "id",
    "wallet_id",
    "user_id",
    "wallet_address",
    "amount",
    "token_symbol",
    "destination_address",
    "status",
    "reviewer_id",
    "tx_hash",
    "created_at",
    "updated_at",
  ].join(",");

  const csvRows = data.map((row) =>
    [
      row.id,
      row.walletId,
      row.userId ?? "",
      row.walletAddress ?? "",
      row.amount,
      row.tokenSymbol,
      row.destinationAddress,
      row.status,
      row.reviewerId ?? "",
      row.txHash ?? "",
      row.createdAt.toISOString(),
      row.updatedAt.toISOString(),
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );

  const csvContent = [csvHeader, ...csvRows].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="withdraw-report-${Date.now()}.csv"`,
    },
  });
}
