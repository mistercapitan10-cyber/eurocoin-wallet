import { query } from "./db";

export type RequestStatus = "pending" | "processing" | "completed" | "rejected" | "cancelled";

// ===== EXCHANGE REQUESTS =====

export interface ExchangeRequest {
  id: string;
  wallet_address: string;
  email: string;
  token_amount: string;
  fiat_amount: string;
  rate: string;
  commission: string;
  comment?: string | null;
  status: RequestStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateExchangeRequestData {
  id: string;
  wallet_address: string;
  email: string;
  token_amount: string;
  fiat_amount: string;
  rate: string;
  commission: string;
  comment?: string;
}

export async function createExchangeRequest(
  data: CreateExchangeRequestData,
): Promise<ExchangeRequest> {
  const result = await query(
    `INSERT INTO exchange_requests 
     (id, wallet_address, email, token_amount, fiat_amount, rate, commission, comment, status) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      data.id,
      data.wallet_address,
      data.email,
      data.token_amount,
      data.fiat_amount,
      data.rate,
      data.commission,
      data.comment || null,
      "pending",
    ],
  );

  return result.rows[0];
}

export async function getExchangeRequestById(id: string): Promise<ExchangeRequest | null> {
  const result = await query("SELECT * FROM exchange_requests WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function getExchangeRequestsByWallet(
  walletAddress: string,
): Promise<ExchangeRequest[]> {
  const result = await query(
    "SELECT * FROM exchange_requests WHERE wallet_address = $1 ORDER BY created_at DESC",
    [walletAddress],
  );

  return result.rows;
}

export async function updateExchangeRequestStatus(
  id: string,
  status: RequestStatus,
): Promise<ExchangeRequest> {
  const result = await query(
    "UPDATE exchange_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
    [status, id],
  );

  return result.rows[0];
}

export async function getAllExchangeRequests(): Promise<ExchangeRequest[]> {
  const result = await query("SELECT * FROM exchange_requests ORDER BY created_at DESC");

  return result.rows;
}

// ===== INTERNAL REQUESTS =====

export interface InternalRequest {
  id: string;
  wallet_address?: string | null;
  requester: string;
  email?: string | null;
  department: string;
  request_type: string;
  priority: string;
  description: string;
  status: RequestStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInternalRequestData {
  id: string;
  wallet_address?: string;
  requester: string;
  email?: string;
  department: string;
  request_type: string;
  priority: string;
  description: string;
}

export async function createInternalRequest(
  data: CreateInternalRequestData,
): Promise<InternalRequest> {
  const result = await query(
    `INSERT INTO internal_requests 
     (id, wallet_address, requester, email, department, request_type, priority, description, status) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      data.id,
      data.wallet_address || null,
      data.requester,
      data.email || null,
      data.department,
      data.request_type,
      data.priority,
      data.description,
      "pending",
    ],
  );

  return result.rows[0];
}

export async function getInternalRequestById(id: string): Promise<InternalRequest | null> {
  const result = await query("SELECT * FROM internal_requests WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function getInternalRequestsByWallet(
  walletAddress: string,
): Promise<InternalRequest[]> {
  const result = await query(
    "SELECT * FROM internal_requests WHERE wallet_address = $1 ORDER BY created_at DESC",
    [walletAddress],
  );

  return result.rows;
}

export async function updateInternalRequestStatus(
  id: string,
  status: RequestStatus,
): Promise<InternalRequest> {
  const result = await query(
    "UPDATE internal_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
    [status, id],
  );

  return result.rows[0];
}

export async function getAllInternalRequests(): Promise<InternalRequest[]> {
  const result = await query("SELECT * FROM internal_requests ORDER BY created_at DESC");

  return result.rows;
}
