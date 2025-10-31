import { query } from './db';

// ============================================
// Types
// ============================================

export interface SupportMessage {
  id: string;
  session_id: string;
  user_wallet_address: string;
  type: 'user' | 'admin' | 'system';
  text: string;
  admin_id?: number;
  admin_username?: string;
  is_read: boolean;
  created_at: Date;
}

export interface TypingIndicator {
  id: string;
  user_wallet_address: string;
  admin_id: number;
  admin_username?: string;
  is_typing: boolean;
  started_at: Date;
  expires_at: Date;
}

export interface SupportSession {
  id: string;
  user_wallet_address: string;
  telegram_chat_id?: number;
  locale: string;
  is_admin_mode: boolean;
  last_admin_message_at?: Date;
  unread_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface SupportMessageStats {
  total_messages: number;
  unread_messages: number;
  last_message_at?: Date;
  last_admin_message_at?: Date;
}

// ============================================
// Support Messages Queries
// ============================================

/**
 * Create a new support message
 */
export async function createSupportMessage(params: {
  sessionId: string;
  walletAddress: string;
  type: 'user' | 'admin' | 'system';
  text: string;
  adminId?: number;
  adminUsername?: string;
}): Promise<SupportMessage> {
  const result = await query(
    `INSERT INTO support_messages
     (session_id, user_wallet_address, type, text, admin_id, admin_username, is_read)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE)
     RETURNING *`,
    [
      params.sessionId,
      params.walletAddress,
      params.type,
      params.text,
      params.adminId || null,
      params.adminUsername || null,
    ]
  );

  return result.rows[0];
}

/**
 * Get messages for a session
 */
export async function getMessagesBySession(
  sessionId: string,
  limit: number = 100
): Promise<SupportMessage[]> {
  const result = await query(
    `SELECT * FROM support_messages
     WHERE session_id = $1
     ORDER BY created_at ASC
     LIMIT $2`,
    [sessionId, limit]
  );

  return result.rows;
}

/**
 * Get messages by wallet address (across all sessions)
 */
export async function getMessagesByWallet(
  walletAddress: string,
  limit: number = 100
): Promise<SupportMessage[]> {
  const result = await query(
    `SELECT sm.*
     FROM support_messages sm
     JOIN chatbot_sessions cs ON sm.session_id = cs.id
     WHERE cs.user_wallet_address = $1
     ORDER BY sm.created_at DESC
     LIMIT $2`,
    [walletAddress, limit]
  );

  return result.rows.reverse(); // Return in chronological order
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  sessionId: string,
  messageType: 'admin' | 'user' = 'admin'
): Promise<number> {
  const result = await query(
    `UPDATE support_messages
     SET is_read = TRUE
     WHERE session_id = $1 AND type = $2 AND is_read = FALSE`,
    [sessionId, messageType]
  );

  return result.rowCount || 0;
}

/**
 * Get unread message count for a wallet
 */
export async function getUnreadCount(walletAddress: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) as count
     FROM support_messages sm
     JOIN chatbot_sessions cs ON sm.session_id = cs.id
     WHERE cs.user_wallet_address = $1
       AND sm.type = 'admin'
       AND sm.is_read = FALSE`,
    [walletAddress]
  );

  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get support message statistics
 */
export async function getSupportMessageStats(
  walletAddress: string
): Promise<SupportMessageStats> {
  const result = await query(
    `SELECT * FROM get_support_message_stats($1)`,
    [walletAddress]
  );

  const row = result.rows[0];
  return {
    total_messages: parseInt(row?.total_messages || '0', 10),
    unread_messages: parseInt(row?.unread_messages || '0', 10),
    last_message_at: row?.last_message_at || undefined,
    last_admin_message_at: row?.last_admin_message_at || undefined,
  };
}

// ============================================
// Session Queries
// ============================================

/**
 * Get or create a chatbot session
 */
export async function getOrCreateSession(
  walletAddress: string
): Promise<SupportSession> {
  const result = await query(
    `INSERT INTO chatbot_sessions (user_wallet_address)
     VALUES ($1)
     ON CONFLICT (user_wallet_address)
     DO UPDATE SET updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [walletAddress]
  );

  return result.rows[0];
}

/**
 * Get session by ID
 */
export async function getSessionById(sessionId: string): Promise<SupportSession | null> {
  const result = await query(
    `SELECT * FROM chatbot_sessions WHERE id = $1`,
    [sessionId]
  );

  return result.rows[0] || null;
}

/**
 * Get latest session for a wallet
 */
export async function getLatestSessionByWallet(
  walletAddress: string
): Promise<SupportSession | null> {
  const result = await query(
    `SELECT * FROM chatbot_sessions
     WHERE user_wallet_address = $1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [walletAddress]
  );

  return result.rows[0] || null;
}

/**
 * Update session unread count
 */
export async function updateSessionUnreadCount(
  sessionId: string,
  count: number
): Promise<void> {
  await query(
    `UPDATE chatbot_sessions
     SET unread_count = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [sessionId, count]
  );
}

/**
 * Reset session unread count
 */
export async function resetSessionUnreadCount(sessionId: string): Promise<void> {
  await query(
    `UPDATE chatbot_sessions
     SET unread_count = 0,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [sessionId]
  );
}

// ============================================
// Typing Indicators Queries
// ============================================

/**
 * Set typing indicator for an admin
 */
export async function setTypingIndicator(params: {
  walletAddress: string;
  adminId: number;
  adminUsername?: string;
  isTyping: boolean;
}): Promise<void> {
  if (params.isTyping) {
    // Delete existing indicator first
    await query(
      `DELETE FROM typing_indicators
       WHERE user_wallet_address = $1 AND admin_id = $2`,
      [params.walletAddress, params.adminId]
    );

    // Insert new indicator with 30 second expiry
    await query(
      `INSERT INTO typing_indicators
       (user_wallet_address, admin_id, admin_username, is_typing, expires_at)
       VALUES ($1, $2, $3, TRUE, NOW() + INTERVAL '30 seconds')`,
      [params.walletAddress, params.adminId, params.adminUsername || null]
    );
  } else {
    // Remove typing indicator
    await query(
      `DELETE FROM typing_indicators
       WHERE user_wallet_address = $1 AND admin_id = $2`,
      [params.walletAddress, params.adminId]
    );
  }
}

/**
 * Get active typing indicator for a wallet
 */
export async function getTypingIndicator(
  walletAddress: string
): Promise<TypingIndicator | null> {
  // First cleanup expired indicators (delete directly instead of calling function)
  await query(`DELETE FROM typing_indicators WHERE expires_at < NOW()`);

  // Get active typing indicator
  const result = await query(
    `SELECT * FROM typing_indicators
     WHERE user_wallet_address = $1 AND is_typing = TRUE
     ORDER BY started_at DESC
     LIMIT 1`,
    [walletAddress]
  );

  return result.rows[0] || null;
}

/**
 * Cleanup expired typing indicators (should be called periodically)
 */
export async function cleanupExpiredTypingIndicators(): Promise<number> {
  const result = await query(`DELETE FROM typing_indicators WHERE expires_at < NOW()`);
  return result.rowCount || 0;
}

// ============================================
// Chat History Queries
// ============================================

/**
 * Get chat history (last N messages)
 */
export async function getChatHistory(
  walletAddress: string,
  limit: number = 10
): Promise<SupportMessage[]> {
  const result = await query(
    `SELECT
       sm.id,
       sm.type,
       sm.text,
       sm.admin_username,
       sm.created_at,
       sm.is_read,
       cs.user_wallet_address
     FROM support_messages sm
     JOIN chatbot_sessions cs ON sm.session_id = cs.id
     WHERE cs.user_wallet_address = $1
     ORDER BY sm.created_at DESC
     LIMIT $2`,
    [walletAddress, limit]
  );

  return result.rows.reverse(); // Return in chronological order
}

/**
 * Get active support sessions (for admin dashboard)
 */
export async function getActiveSupportSessions(
  hoursAgo: number = 24
): Promise<Array<SupportSession & { message_count: number }>> {
  const result = await query(
    `SELECT
       cs.*,
       COUNT(sm.id) as message_count
     FROM chatbot_sessions cs
     LEFT JOIN support_messages sm ON cs.id = sm.session_id
     WHERE cs.updated_at > NOW() - INTERVAL '${hoursAgo} hours'
     GROUP BY cs.id
     ORDER BY cs.updated_at DESC`,
    []
  );

  return result.rows;
}
