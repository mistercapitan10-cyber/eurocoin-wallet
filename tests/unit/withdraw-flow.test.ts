import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { QueryCall } from "./types";

type QueryResult = { rows: Array<Record<string, unknown>> };

const queryMock = vi.fn();
const getClientMock = vi.fn();

vi.mock("@/config/token", () => ({
  TOKEN_CONFIG: {
    symbol: "EURC",
    decimals: 18,
    address: "0x0000000000000000000000000000000000000000",
  },
}));

vi.mock("@/lib/database/db", () => ({
  query: (...args: QueryCall) => queryMock(...args),
  getClient: (...args: QueryCall) => getClientMock(...args),
}));

import { updateWithdrawRequestStatus } from "@/lib/database/internal-balance-queries";

const makeClient = () => {
  const client = {
    query: vi.fn(),
    release: vi.fn(),
  };
  return client;
};

const makeWithdrawRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "req-1",
  wallet_id: "wallet-1",
  token_symbol: "EURC",
  amount: "4000000000000000000",
  destination_address: "0x1234567890123456789012345678901234567890",
  status: "pending",
  reviewer_id: null,
  tx_hash: null,
  notes: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const makeBalanceRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "balance-1",
  wallet_id: "wallet-1",
  token_symbol: "EURC",
  balance: "10000000000000000000",
  pending_onchain: "4000000000000000000",
  locked_amount: "0",
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe("updateWithdrawRequestStatus", () => {
  beforeEach(() => {
    queryMock.mockReset();
    getClientMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("debites balance and releases pending on approved", async () => {
    const client = makeClient();
    getClientMock.mockResolvedValue(client);

    const withdrawRow = makeWithdrawRow({ status: "pending" });
    const balanceRow = makeBalanceRow();
    const updatedBalanceRow = {
      ...balanceRow,
      balance: "6000000000000000000",
      pending_onchain: "0",
    };

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [withdrawRow] })
      .mockResolvedValueOnce({ rows: [balanceRow] })
      .mockResolvedValueOnce({ rows: [updatedBalanceRow] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "ledger-1",
            wallet_id: "wallet-1",
            token_symbol: "EURC",
            entry_type: "payout",
            amount: "4000000000000000000",
            balance_after: "6000000000000000000",
            reference: "Withdraw req-1",
            metadata: { withdrawId: "req-1" },
            created_by: "system",
            created_at: new Date(),
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [withdrawRow] });

    await updateWithdrawRequestStatus({
      requestId: "req-1",
      status: "approved",
      reviewerId: null,
    });

    expect(client.query).toHaveBeenCalled();
    const updateBalanceCall = (client.query.mock.calls as QueryCall[]).find((call) =>
      String(call[0]).includes("UPDATE internal_balances"),
    );
    expect(updateBalanceCall).toBeTruthy();
  });

  it("does not double-debit on completed after approved", async () => {
    const client = makeClient();
    getClientMock.mockResolvedValue(client);

    const withdrawRow = makeWithdrawRow({ status: "processing" });
    const balanceRow = makeBalanceRow({ pending_onchain: "0" });

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [withdrawRow] })
      .mockResolvedValueOnce({ rows: [balanceRow] })
      .mockResolvedValueOnce({ rows: [{ exists: 1 }] })
      .mockResolvedValueOnce({ rows: [withdrawRow] });

    await updateWithdrawRequestStatus({
      requestId: "req-1",
      status: "completed",
      reviewerId: null,
      txHash: "0xdeadbeef",
    });

    const updateBalanceCall = (client.query.mock.calls as QueryCall[]).find((call) =>
      String(call[0]).includes("UPDATE internal_balances"),
    );
    expect(updateBalanceCall).toBeUndefined();
  });

  it("releases pending amount on cancelled", async () => {
    const client = makeClient();
    getClientMock.mockResolvedValue(client);

    const withdrawRow = makeWithdrawRow({ status: "pending" });
    const balanceRow = makeBalanceRow();
    const updatedBalanceRow = {
      ...balanceRow,
      pending_onchain: "0",
    };

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [withdrawRow] })
      .mockResolvedValueOnce({ rows: [balanceRow] })
      .mockResolvedValueOnce({ rows: [updatedBalanceRow] })
      .mockResolvedValueOnce({ rows: [{ ...withdrawRow, status: "cancelled" }] });

    await updateWithdrawRequestStatus({
      requestId: "req-1",
      status: "cancelled",
      reviewerId: "user-1",
    });

    const updateBalanceCall = (client.query.mock.calls as QueryCall[]).find(
      (call) =>
        String(call[0]).includes("UPDATE internal_balances") &&
        String(call[0]).includes("pending_onchain = GREATEST"),
    );
    expect(updateBalanceCall).toBeTruthy();
  });

  it("refunds balance when failed after payout", async () => {
    const client = makeClient();
    getClientMock.mockResolvedValue(client);

    const withdrawRow = makeWithdrawRow({ status: "processing" });
    const balanceRow = makeBalanceRow({ balance: "6000000000000000000", pending_onchain: "0" });
    const refundedBalanceRow = {
      ...balanceRow,
      balance: "8000000000000000000",
    };

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [withdrawRow] })
      .mockResolvedValueOnce({ rows: [balanceRow] })
      .mockResolvedValueOnce({ rows: [{ exists: 1 }] })
      .mockResolvedValueOnce({ rows: [refundedBalanceRow] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "ledger-2",
            wallet_id: "wallet-1",
            token_symbol: "EURC",
            entry_type: "refund",
            amount: "2000000000000000000",
            balance_after: "8000000000000000000",
            reference: "Withdraw req-1 failed",
            metadata: { withdrawId: "req-1" },
            created_by: "system",
            created_at: new Date(),
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [withdrawRow] });

    await updateWithdrawRequestStatus({
      requestId: "req-1",
      status: "failed",
      reviewerId: null,
    });

    const refundCall = (client.query.mock.calls as QueryCall[]).find(
      (call) =>
        String(call[0]).includes("entry_type, amount, balance_after") &&
        String(call[0]).includes("refund"),
    );
    expect(refundCall).toBeTruthy();
  });
});
