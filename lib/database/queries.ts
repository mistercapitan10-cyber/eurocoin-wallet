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
  current_stage?: string | null;
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
  user_id?: string;
}

export async function createExchangeRequest(
  data: CreateExchangeRequestData,
): Promise<ExchangeRequest> {
  const result = await query(
    `INSERT INTO exchange_requests
     (id, wallet_address, email, token_amount, fiat_amount, rate, commission, comment, status, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      data.user_id || null,
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

export async function getExchangeRequestsByUserId(userId: string): Promise<ExchangeRequest[]> {
  const result = await query(
    "SELECT * FROM exchange_requests WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );

  return result.rows;
}

export async function getExchangeRequestsByEmail(email: string): Promise<ExchangeRequest[]> {
  const result = await query(
    "SELECT * FROM exchange_requests WHERE email = $1 ORDER BY created_at DESC",
    [email],
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

export async function updateExchangeRequestStage(
  id: string,
  stage: string,
): Promise<ExchangeRequest> {
  const result = await query(
    "UPDATE exchange_requests SET current_stage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
    [stage, id],
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
  current_stage?: string | null;
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
  user_id?: string;
}

export async function createInternalRequest(
  data: CreateInternalRequestData,
): Promise<InternalRequest> {
  const result = await query(
    `INSERT INTO internal_requests
     (id, wallet_address, requester, email, department, request_type, priority, description, status, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      data.user_id || null,
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

export async function getInternalRequestsByUserId(userId: string): Promise<InternalRequest[]> {
  const result = await query(
    "SELECT * FROM internal_requests WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );

  return result.rows;
}

export async function getInternalRequestsByEmail(email: string): Promise<InternalRequest[]> {
  const result = await query(
    "SELECT * FROM internal_requests WHERE email = $1 ORDER BY created_at DESC",
    [email],
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

export async function updateInternalRequestStage(
  id: string,
  stage: string,
): Promise<InternalRequest> {
  const result = await query(
    "UPDATE internal_requests SET current_stage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
    [stage, id],
  );

  return result.rows[0];
}

export async function getAllInternalRequests(): Promise<InternalRequest[]> {
  const result = await query("SELECT * FROM internal_requests ORDER BY created_at DESC");

  return result.rows;
}

// ===== CHATBOT SESSIONS =====

export interface ChatbotSession {
  id: string;
  user_wallet_address: string;
  telegram_chat_id?: number | null;
  locale: string;
  is_admin_mode: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ChatbotMessage {
  id: string;
  session_id: string;
  type: "user" | "bot" | "admin";
  text: string;
  translated_text?: string | null;
  is_translated: boolean;
  is_admin_response: boolean;
  created_at: Date;
}

export async function createChatbotSession(data: {
  userWalletAddress: string;
  locale: string;
}): Promise<ChatbotSession> {
  const result = await query(
    `INSERT INTO chatbot_sessions (user_wallet_address, locale) 
     VALUES ($1, $2) 
     RETURNING *`,
    [data.userWalletAddress, data.locale],
  );

  return result.rows[0];
}

export async function getChatbotSessionById(id: string): Promise<ChatbotSession | null> {
  const result = await query("SELECT * FROM chatbot_sessions WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function getChatbotSessionByWallet(
  walletAddress: string,
): Promise<ChatbotSession | null> {
  const result = await query(
    "SELECT * FROM chatbot_sessions WHERE user_wallet_address = $1 ORDER BY created_at DESC LIMIT 1",
    [walletAddress],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function updateChatbotSession(
  sessionId: string,
  updates: Partial<ChatbotSession>,
): Promise<ChatbotSession> {
  const updatesList = Object.entries(updates)
    .filter(([_, value]) => value !== undefined)
    .map(([key], index) => `${key} = $${index + 2}`)
    .join(", ");

  const values = Object.values(updates).filter((v) => v !== undefined);

  const result = await query(
    `UPDATE chatbot_sessions SET ${updatesList} WHERE id = $1 RETURNING *`,
    [sessionId, ...values],
  );

  return result.rows[0];
}

export async function createChatbotMessage(data: {
  sessionId: string;
  type: "user" | "bot" | "admin";
  text: string;
  translatedText?: string;
  isTranslated?: boolean;
  isAdminResponse?: boolean;
}): Promise<ChatbotMessage> {
  const result = await query(
    `INSERT INTO chatbot_messages 
     (session_id, type, text, translated_text, is_translated, is_admin_response) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [
      data.sessionId,
      data.type,
      data.text,
      data.translatedText || null,
      data.isTranslated || false,
      data.isAdminResponse || false,
    ],
  );

  // Update session updated_at
  await query("UPDATE chatbot_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [
    data.sessionId,
  ]);

  return result.rows[0];
}

export async function getChatbotMessagesBySession(sessionId: string): Promise<ChatbotMessage[]> {
  const result = await query(
    "SELECT * FROM chatbot_messages WHERE session_id = $1 ORDER BY created_at ASC",
    [sessionId],
  );

  return result.rows;
}

export async function getActiveChatbotSessions(): Promise<ChatbotSession[]> {
  const result = await query(
    `SELECT * FROM chatbot_sessions 
     WHERE updated_at > NOW() - INTERVAL '24 hours' 
     ORDER BY updated_at DESC`,
  );

  return result.rows;
}
