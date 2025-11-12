import { PoolClient } from "pg";
import { query, getClient } from "./db";
import { TOKEN_CONFIG } from "@/config/token";

const DEFAULT_TOKEN_SYMBOL = (TOKEN_CONFIG.symbol || "EURC").toUpperCase();
const DEFAULT_TOKEN_DECIMALS =
  Number.isFinite(TOKEN_CONFIG.decimals) && Number(TOKEN_CONFIG.decimals) > 0
    ? Number(TOKEN_CONFIG.decimals)
    : 18;
const DEFAULT_LEDGER_LIMIT = 10;

export type LedgerEntryType = "credit" | "debit" | "adjustment" | "payout";
export type WithdrawStatus = "pending" | "approved" | "processing" | "completed" | "rejected";

export interface InternalWalletRecord {
  id: string;
  userId: string | null;
  walletAddress: string | null;
  defaultWithdrawAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InternalBalanceRecord {
  id: string;
  walletId: string;
  tokenSymbol: string;
  balance: string;
  pendingOnchain: string;
  lockedAmount: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InternalLedgerRecord {
  id: string;
  walletId: string;
  tokenSymbol: string;
  entryType: LedgerEntryType;
  amount: string;
  balanceAfter: string;
  reference: string | null;
  metadata: Record<string, unknown> | null;
  createdBy: string | null;
  createdAt: Date;
}

export interface BalanceSnapshot {
  wallet: InternalWalletRecord;
  balance: InternalBalanceRecord;
  ledger: InternalLedgerRecord[];
  tokenSymbol: string;
  decimals: number;
}

export interface WithdrawRequestRecord {
  id: string;
  walletId: string;
  tokenSymbol: string;
  amount: string;
  destinationAddress: string;
  status: WithdrawStatus;
  reviewerId: string | null;
  txHash: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BalanceIdentifier {
  userId: string;
  walletAddress?: string | null;
  defaultWithdrawAddress?: string | null;
}

function normalizeWalletAddress(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.toLowerCase();
}

function toNumericString(value: unknown): string {
  if (value === null || typeof value === "undefined") {
    return "0";
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "number") {
    return Math.trunc(value).toString();
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

function mapWalletRow(row: Record<string, unknown>): InternalWalletRecord {
  return {
    id: row.id as string,
    userId: (row.user_id as string) ?? null,
    walletAddress: (row.wallet_address as string) ?? null,
    defaultWithdrawAddress: (row.default_withdraw_address as string) ?? null,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

function mapBalanceRow(row: Record<string, unknown>): InternalBalanceRecord {
  return {
    id: row.id as string,
    walletId: row.wallet_id as string,
    tokenSymbol: (row.token_symbol as string)?.toUpperCase() ?? DEFAULT_TOKEN_SYMBOL,
    balance: toNumericString(row.balance),
    pendingOnchain: toNumericString(row.pending_onchain),
    lockedAmount: toNumericString(row.locked_amount),
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

function mapLedgerRow(row: Record<string, unknown>): InternalLedgerRecord {
  return {
    id: row.id as string,
    walletId: row.wallet_id as string,
    tokenSymbol: (row.token_symbol as string)?.toUpperCase() ?? DEFAULT_TOKEN_SYMBOL,
    entryType: (row.entry_type as LedgerEntryType) ?? "credit",
    amount: toNumericString(row.amount),
    balanceAfter: toNumericString(row.balance_after),
    reference: (row.reference as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as Date,
  };
}

function mapWithdrawRow(row: Record<string, unknown>): WithdrawRequestRecord {
  return {
    id: row.id as string,
    walletId: row.wallet_id as string,
    tokenSymbol: (row.token_symbol as string)?.toUpperCase() ?? DEFAULT_TOKEN_SYMBOL,
    amount: toNumericString(row.amount),
    destinationAddress: row.destination_address as string,
    status: (row.status as WithdrawStatus) ?? "pending",
    reviewerId: (row.reviewer_id as string) ?? null,
    txHash: (row.tx_hash as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

function calculateAvailableAmount(balanceRow: Record<string, unknown>): bigint {
  const total = BigInt(toNumericString(balanceRow.balance));
  const pending = BigInt(toNumericString(balanceRow.pending_onchain));
  const locked = BigInt(toNumericString(balanceRow.locked_amount));
  const available = total - pending - locked;
  return available > BigInt(0) ? available : BigInt(0);
}

async function ensureInternalWalletRecord(
  identifier: BalanceIdentifier,
  client?: PoolClient,
): Promise<InternalWalletRecord> {
  if (!identifier.userId) {
    throw new Error("Internal wallet identifier requires userId");
  }

  const executor = client ?? null;
  const walletAddress = normalizeWalletAddress(identifier.walletAddress);
  const defaultWithdrawAddress = identifier.defaultWithdrawAddress
    ? identifier.defaultWithdrawAddress
    : null;

  let existing;
  try {
    existing = await (executor
      ? executor.query("SELECT * FROM internal_wallets WHERE user_id = $1 LIMIT 1", [
          identifier.userId,
        ])
      : query("SELECT * FROM internal_wallets WHERE user_id = $1 LIMIT 1", [identifier.userId]));
  } catch (queryError) {
    console.error("[internal-balance-queries] Failed to query internal_wallets:", {
      userId: identifier.userId,
      error: queryError instanceof Error ? queryError.message : String(queryError),
    });
    throw new Error(
      `Database query failed: ${queryError instanceof Error ? queryError.message : String(queryError)}`,
    );
  }

  if (existing.rows.length > 0) {
    const walletRow = existing.rows[0] as Record<string, unknown>;
    const currentAddress = walletRow.wallet_address as string | null;

    if (walletAddress && walletAddress !== currentAddress) {
      const updated = await (executor
        ? executor.query(
            `UPDATE internal_wallets
             SET wallet_address = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [walletAddress, walletRow.id as string],
          )
        : query(
            `UPDATE internal_wallets
             SET wallet_address = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [walletAddress, walletRow.id as string],
          ));
      return mapWalletRow(updated.rows[0] as Record<string, unknown>);
    }

    return mapWalletRow(walletRow);
  }

  let inserted;
  try {
    inserted = await (executor
      ? executor.query(
          `INSERT INTO internal_wallets (user_id, wallet_address, default_withdraw_address)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [identifier.userId, walletAddress, defaultWithdrawAddress],
        )
      : query(
          `INSERT INTO internal_wallets (user_id, wallet_address, default_withdraw_address)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [identifier.userId, walletAddress, defaultWithdrawAddress],
        ));
  } catch (insertError) {
    console.error("[internal-balance-queries] Failed to insert internal_wallet:", {
      userId: identifier.userId,
      walletAddress,
      error: insertError instanceof Error ? insertError.message : String(insertError),
    });
    throw new Error(
      `Failed to create internal wallet: ${insertError instanceof Error ? insertError.message : String(insertError)}`,
    );
  }

  if (!inserted.rows || inserted.rows.length === 0) {
    throw new Error("Failed to create internal wallet: no rows returned");
  }

  return mapWalletRow(inserted.rows[0] as Record<string, unknown>);
}

async function ensureInternalBalanceRecord(
  walletId: string,
  tokenSymbol: string,
  client?: PoolClient,
): Promise<InternalBalanceRecord> {
  const executor = client ?? null;

  const normalizedSymbol = tokenSymbol.toUpperCase();

  try {
    if (executor) {
      await executor.query(
        `INSERT INTO internal_balances (wallet_id, token_symbol)
         VALUES ($1, $2)
         ON CONFLICT (wallet_id, token_symbol) DO NOTHING`,
        [walletId, normalizedSymbol],
      );

      const result = await executor.query(
        `SELECT * FROM internal_balances
         WHERE wallet_id = $1 AND token_symbol = $2
         LIMIT 1`,
        [walletId, normalizedSymbol],
      );

      if (!result.rows || result.rows.length === 0) {
        throw new Error(
          `Balance record not found after insert for wallet ${walletId} and token ${normalizedSymbol}`,
        );
      }

      return mapBalanceRow(result.rows[0] as Record<string, unknown>);
    }

    await query(
      `INSERT INTO internal_balances (wallet_id, token_symbol)
       VALUES ($1, $2)
       ON CONFLICT (wallet_id, token_symbol) DO NOTHING`,
      [walletId, normalizedSymbol],
    );

    const result = await query(
      `SELECT * FROM internal_balances
       WHERE wallet_id = $1 AND token_symbol = $2
       LIMIT 1`,
      [walletId, normalizedSymbol],
    );

    if (!result.rows || result.rows.length === 0) {
      throw new Error(
        `Balance record not found after insert for wallet ${walletId} and token ${normalizedSymbol}`,
      );
    }

    return mapBalanceRow(result.rows[0] as Record<string, unknown>);
  } catch (error) {
    console.error("[internal-balance-queries] Failed to ensure balance record:", {
      walletId,
      tokenSymbol: normalizedSymbol,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getInternalBalanceSnapshot(
  identifier: BalanceIdentifier,
  options?: { ledgerLimit?: number },
): Promise<BalanceSnapshot> {
  try {
    if (!identifier.userId) {
      throw new Error("getInternalBalanceSnapshot: userId is required");
    }

    console.log("[internal-balance-queries] getInternalBalanceSnapshot called:", {
      userId: identifier.userId,
      walletAddress: identifier.walletAddress,
    });

    let wallet: InternalWalletRecord;
    try {
      wallet = await ensureInternalWalletRecord(identifier);
      console.log("[internal-balance-queries] Wallet ensured:", { walletId: wallet.id });
    } catch (walletError) {
      console.error("[internal-balance-queries] Failed to ensure wallet:", walletError);
      throw new Error(
        `Failed to ensure internal wallet: ${walletError instanceof Error ? walletError.message : String(walletError)}`,
      );
    }

    let balance: InternalBalanceRecord;
    try {
      balance = await ensureInternalBalanceRecord(wallet.id, DEFAULT_TOKEN_SYMBOL);
      console.log("[internal-balance-queries] Balance ensured:", { balanceId: balance.id });
    } catch (balanceError) {
      console.error("[internal-balance-queries] Failed to ensure balance:", balanceError);
      throw new Error(
        `Failed to ensure internal balance: ${balanceError instanceof Error ? balanceError.message : String(balanceError)}`,
      );
    }

    const ledgerLimit = options?.ledgerLimit ?? DEFAULT_LEDGER_LIMIT;

    let ledgerResult;
    try {
      ledgerResult = await query(
        `SELECT *
         FROM internal_ledger
         WHERE wallet_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [wallet.id, ledgerLimit],
      );
      console.log("[internal-balance-queries] Ledger loaded:", {
        entries: ledgerResult.rows.length,
      });
    } catch (ledgerError) {
      console.error("[internal-balance-queries] Failed to load ledger:", ledgerError);
      throw new Error(
        `Failed to load ledger: ${ledgerError instanceof Error ? ledgerError.message : String(ledgerError)}`,
      );
    }

    const ledger = ledgerResult.rows.map((row) => mapLedgerRow(row));

    return {
      wallet,
      balance,
      ledger,
      tokenSymbol: DEFAULT_TOKEN_SYMBOL,
      decimals: DEFAULT_TOKEN_DECIMALS,
    };
  } catch (error) {
    console.error("[internal-balance-queries] getInternalBalanceSnapshot error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      identifier,
    });
    throw error;
  }
}

interface BalanceMutationParams extends BalanceIdentifier {
  amount: bigint;
  tokenSymbol?: string;
  reference?: string;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
}

interface BalanceMutationResult {
  wallet: InternalWalletRecord;
  balance: InternalBalanceRecord;
  ledgerEntry: InternalLedgerRecord;
}

async function mutateInternalBalance(
  params: BalanceMutationParams,
  direction: "credit" | "debit",
): Promise<BalanceMutationResult> {
  if (params.amount <= BigInt(0)) {
    throw new Error("Amount must be greater than zero");
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");

    const wallet = await ensureInternalWalletRecord(params, client);
    const tokenSymbol = (params.tokenSymbol || DEFAULT_TOKEN_SYMBOL).toUpperCase();

    await ensureInternalBalanceRecord(wallet.id, tokenSymbol, client);

    const balanceResult = await client.query(
      `SELECT *
       FROM internal_balances
       WHERE wallet_id = $1 AND token_symbol = $2
       FOR UPDATE`,
      [wallet.id, tokenSymbol],
    );

    if (balanceResult.rows.length === 0) {
      throw new Error("Failed to load internal balance for wallet");
    }

    const currentBalance = BigInt(toNumericString(balanceResult.rows[0].balance));
    const delta = direction === "credit" ? params.amount : -params.amount;

    if (direction === "debit" && currentBalance < params.amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    const nextBalance = currentBalance + delta;

    const updatedBalance = await client.query(
      `UPDATE internal_balances
       SET balance = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [nextBalance.toString(), balanceResult.rows[0].id],
    );

    const ledgerInsert = await client.query(
      `INSERT INTO internal_ledger
         (wallet_id, token_symbol, entry_type, amount, balance_after, reference, metadata, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        wallet.id,
        tokenSymbol,
        direction,
        params.amount.toString(),
        nextBalance.toString(),
        params.reference ?? null,
        params.metadata ? JSON.stringify(params.metadata) : null,
        params.createdBy ?? null,
      ],
    );

    await client.query("COMMIT");

    return {
      wallet,
      balance: mapBalanceRow(updatedBalance.rows[0] as Record<string, unknown>),
      ledgerEntry: mapLedgerRow(ledgerInsert.rows[0] as Record<string, unknown>),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function creditInternalBalance(
  params: BalanceMutationParams,
): Promise<BalanceMutationResult> {
  return mutateInternalBalance(params, "credit");
}

export async function debitInternalBalance(
  params: BalanceMutationParams,
): Promise<BalanceMutationResult> {
  return mutateInternalBalance(params, "debit");
}

interface WithdrawIdentifier extends BalanceIdentifier {
  destinationAddress: string;
  note?: string | null;
  amount: bigint;
  tokenSymbol?: string;
}

export interface WithdrawCreationResult {
  request: WithdrawRequestRecord;
  balance: InternalBalanceRecord;
  wallet: InternalWalletRecord;
}

export async function createWithdrawRequestRecord(
  params: WithdrawIdentifier,
): Promise<WithdrawCreationResult> {
  if (params.amount <= BigInt(0)) {
    throw new Error("Amount must be greater than zero");
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");

    const wallet = await ensureInternalWalletRecord(params, client);
    const tokenSymbol = (params.tokenSymbol || DEFAULT_TOKEN_SYMBOL).toUpperCase();

    await ensureInternalBalanceRecord(wallet.id, tokenSymbol, client);

    const balanceResult = await client.query(
      `SELECT *
       FROM internal_balances
       WHERE wallet_id = $1 AND token_symbol = $2
       FOR UPDATE`,
      [wallet.id, tokenSymbol],
    );

    if (balanceResult.rows.length === 0) {
      throw new Error("Failed to load internal balance for wallet");
    }

    const balanceRow = balanceResult.rows[0] as Record<string, unknown>;
    const available = calculateAvailableAmount(balanceRow);

    if (available < params.amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    const insertResult = await client.query(
      `INSERT INTO withdraw_requests
         (wallet_id, token_symbol, amount, destination_address, status, notes)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING *`,
      [
        wallet.id,
        tokenSymbol,
        params.amount.toString(),
        params.destinationAddress,
        params.note ?? null,
      ],
    );

    const updatedBalance = await client.query(
      `UPDATE internal_balances
       SET pending_onchain = pending_onchain + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [params.amount.toString(), balanceRow.id as string],
    );

    await client.query("COMMIT");

    return {
      wallet,
      request: mapWithdrawRow(insertResult.rows[0] as Record<string, unknown>),
      balance: mapBalanceRow(updatedBalance.rows[0] as Record<string, unknown>),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listWithdrawRequests(
  identifier: BalanceIdentifier,
  options?: { limit?: number },
): Promise<WithdrawRequestRecord[]> {
  const wallet = await ensureInternalWalletRecord(identifier);

  const limit = options?.limit ?? 25;
  const result = await query(
    `SELECT *
     FROM withdraw_requests
     WHERE wallet_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [wallet.id, limit],
  );

  return result.rows.map((row) => mapWithdrawRow(row));
}

interface WithdrawStatusUpdateParams {
  requestId: string;
  status: Exclude<WithdrawStatus, "pending">;
  reviewerId?: string | null;
  txHash?: string | null;
  notes?: string | null;
}

export async function updateWithdrawRequestStatus(
  params: WithdrawStatusUpdateParams,
): Promise<WithdrawRequestRecord> {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const requestResult = await client.query(
      `SELECT *
       FROM withdraw_requests
       WHERE id = $1
       FOR UPDATE`,
      [params.requestId],
    );

    if (requestResult.rows.length === 0) {
      throw new Error("WITHDRAW_REQUEST_NOT_FOUND");
    }

    const current = mapWithdrawRow(requestResult.rows[0] as Record<string, unknown>);
    if (current.status === params.status) {
      await client.query("ROLLBACK");
      return current;
    }

    if (current.status === "rejected" || current.status === "completed") {
      throw new Error("WITHDRAW_REQUEST_FINALIZED");
    }

    let updatedBalanceRow: Record<string, unknown> | null = null;
    const shouldReleasePending = params.status === "rejected";
    const shouldFinalizePayout = params.status === "completed";
    let ledgerRow: InternalLedgerRecord | null = null;

    if (shouldReleasePending || shouldFinalizePayout) {
      const balanceResult = await client.query(
        `SELECT *
         FROM internal_balances
         WHERE wallet_id = $1 AND token_symbol = $2
         FOR UPDATE`,
        [current.walletId, current.tokenSymbol],
      );

      if (balanceResult.rows.length === 0) {
        throw new Error("BALANCE_NOT_FOUND");
      }

      const balanceRow = balanceResult.rows[0] as Record<string, unknown>;
      const balanceId = balanceRow.id as string;
      const amountBigInt = BigInt(current.amount);

      if (shouldFinalizePayout) {
        const availableBalance = BigInt(toNumericString(balanceRow.balance));
        if (availableBalance < amountBigInt) {
          throw new Error("BALANCE_TOO_LOW");
        }

        updatedBalanceRow = (
          await client.query(
            `UPDATE internal_balances
             SET pending_onchain = GREATEST(pending_onchain - $1, 0),
                 balance = GREATEST(balance - $1, 0),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [current.amount, balanceId],
          )
        ).rows[0] as Record<string, unknown>;

        const ledgerResult = await client.query(
          `INSERT INTO internal_ledger
             (wallet_id, token_symbol, entry_type, amount, balance_after, reference, metadata, created_by)
           VALUES ($1, $2, 'payout', $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            current.walletId,
            current.tokenSymbol,
            current.amount,
            toNumericString(updatedBalanceRow.balance),
            `Withdraw ${current.id}`,
            JSON.stringify({
              withdrawId: current.id,
              txHash: params.txHash ?? current.txHash,
            }),
            params.reviewerId ?? "system",
          ],
        );
        ledgerRow = mapLedgerRow(ledgerResult.rows[0] as Record<string, unknown>);
      } else {
        updatedBalanceRow = (
          await client.query(
            `UPDATE internal_balances
             SET pending_onchain = GREATEST(pending_onchain - $1, 0),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [current.amount, balanceId],
          )
        ).rows[0] as Record<string, unknown>;
      }
    }

    const updateResult = await client.query(
      `UPDATE withdraw_requests
       SET status = $1,
           reviewer_id = $2,
           tx_hash = COALESCE($3, tx_hash),
           notes = COALESCE($4, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [
        params.status,
        params.reviewerId ?? null,
        params.txHash ?? null,
        params.notes ?? null,
        params.requestId,
      ],
    );

    await client.query("COMMIT");

    if (updatedBalanceRow) {
      mapBalanceRow(updatedBalanceRow);
    }
    if (ledgerRow) {
      mapLedgerRow(ledgerRow as unknown as Record<string, unknown>);
    }

    return mapWithdrawRow(updateResult.rows[0] as Record<string, unknown>);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

interface WithdrawQueueItem {
  request: WithdrawRequestRecord;
  wallet: InternalWalletRecord;
}

export async function getWithdrawExecutionQueue(
  statuses: WithdrawStatus[] = ["approved"],
  limit = 5,
): Promise<WithdrawQueueItem[]> {
  if (statuses.length === 0) {
    return [];
  }

  const result = await query(
    `SELECT wr.*, iw.id as wallet_id, iw.user_id, iw.wallet_address, iw.default_withdraw_address,
            iw.created_at as wallet_created_at, iw.updated_at as wallet_updated_at
     FROM withdraw_requests wr
     JOIN internal_wallets iw ON wr.wallet_id = iw.id
     WHERE wr.status = ANY($1)
     ORDER BY wr.created_at ASC
     LIMIT $2`,
    [statuses, limit],
  );

  return result.rows.map((row) => ({
    request: mapWithdrawRow(row),
    wallet: {
      id: row.wallet_id as string,
      userId: (row.user_id as string) ?? null,
      walletAddress: (row.wallet_address as string) ?? null,
      defaultWithdrawAddress: (row.default_withdraw_address as string) ?? null,
      createdAt: row.wallet_created_at as Date,
      updatedAt: row.wallet_updated_at as Date,
    },
  }));
}

export async function getWithdrawVolumeSince(userId: string, since: Date): Promise<bigint> {
  const result = await query(
    `SELECT COALESCE(SUM(wr.amount), 0) AS volume
     FROM withdraw_requests wr
     JOIN internal_wallets iw ON wr.wallet_id = iw.id
     WHERE iw.user_id = $1
       AND wr.status != 'rejected'
       AND wr.created_at >= $2`,
    [userId, since],
  );

  const volume = result.rows[0]?.volume ?? "0";
  return BigInt(toNumericString(volume));
}

export interface WithdrawReportRow {
  id: string;
  walletId: string;
  userId: string | null;
  walletAddress: string | null;
  tokenSymbol: string;
  amount: string;
  destinationAddress: string;
  status: WithdrawStatus;
  reviewerId: string | null;
  txHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getWithdrawReport(limit = 1000): Promise<WithdrawReportRow[]> {
  const result = await query(
    `SELECT wr.*, iw.user_id, iw.wallet_address
     FROM withdraw_requests wr
     JOIN internal_wallets iw ON wr.wallet_id = iw.id
     ORDER BY wr.created_at DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    id: row.id as string,
    walletId: row.wallet_id as string,
    userId: (row.user_id as string) ?? null,
    walletAddress: (row.wallet_address as string) ?? null,
    tokenSymbol: (row.token_symbol as string)?.toUpperCase() ?? DEFAULT_TOKEN_SYMBOL,
    amount: toNumericString(row.amount),
    destinationAddress: row.destination_address as string,
    status: (row.status as WithdrawStatus) ?? "pending",
    reviewerId: (row.reviewer_id as string) ?? null,
    txHash: (row.tx_hash as string) ?? null,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  }));
}
