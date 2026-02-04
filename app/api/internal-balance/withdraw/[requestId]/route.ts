import { NextRequest, NextResponse } from "next/server";
import {
  updateWithdrawRequestStatus,
  updateWithdrawRequestFee,
} from "@/lib/database/internal-balance-queries";
import type { WithdrawStatus } from "@/lib/database/internal-balance-queries";

const ALLOWED_STATUSES: WithdrawStatus[] = [
  "approved",
  "processing",
  "completed",
  "rejected",
  "failed",
];

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

function serialize(
  record:
    | Awaited<ReturnType<typeof updateWithdrawRequestStatus>>
    | Awaited<ReturnType<typeof updateWithdrawRequestFee>>,
) {
  return {
    id: record.id,
    walletId: record.walletId,
    tokenSymbol: record.tokenSymbol,
    amount: record.amount,
    feeAmount: record.feeAmount,
    destinationAddress: record.destinationAddress,
    status: record.status,
    reviewerId: record.reviewerId,
    txHash: record.txHash,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const authError = ensureAdminToken(request);
  if (authError) {
    return authError;
  }

  try {
    const { requestId } = await params;
    const payload = (await request.json()) as {
      status?: WithdrawStatus;
      reviewerId?: string;
      txHash?: string;
      notes?: string;
      feeAmount?: string | null;
    };

    // Handle fee update separately
    if (payload.feeAmount !== undefined && payload.status === undefined) {
      const feeAmount =
        payload.feeAmount === null || payload.feeAmount === "" ? null : payload.feeAmount;

      const record = await updateWithdrawRequestFee({
        requestId,
        feeAmount,
      });

      return NextResponse.json({ request: serialize(record) });
    }

    // Handle status update
    if (!payload.status || !ALLOWED_STATUSES.includes(payload.status)) {
      return NextResponse.json({ error: "Unsupported status" }, { status: 400 });
    }

    if (payload.status === "completed" && !payload.txHash) {
      return NextResponse.json(
        { error: "txHash is required to complete withdraw" },
        { status: 400 },
      );
    }

    const record = await updateWithdrawRequestStatus({
      requestId,
      status: payload.status as Exclude<WithdrawStatus, "pending">,
      reviewerId: payload.reviewerId ?? null,
      txHash: payload.txHash ?? null,
      notes: payload.notes ?? null,
    });

    return NextResponse.json({ request: serialize(record) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update status";
    const statusMap: Record<string, number> = {
      WITHDRAW_REQUEST_NOT_FOUND: 404,
      WITHDRAW_REQUEST_FINALIZED: 409,
      INVALID_WITHDRAW_STATUS_TRANSITION: 409,
      USE_FAILED_STATUS_AFTER_APPROVED: 409,
      BALANCE_TOO_LOW: 409,
    };
    return NextResponse.json({ error: message }, { status: statusMap[message] ?? 500 });
  }
}
