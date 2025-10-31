import { NextRequest, NextResponse } from 'next/server';
import {
  createSupportMessage,
  getLatestSessionByWallet,
} from '@/lib/database/support-queries';
import { sanitizeMessageText, isValidWalletAddress } from '@/lib/telegram/notify-admin';
import { query } from '@/lib/database/db';

const MAX_MESSAGE_LENGTH = 2000;

/**
 * POST /api/support/send-admin-message
 * Sends a message from an admin to a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, text, adminId, adminUsername, sessionId } = body;

    // Validation
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid walletAddress' },
        { status: 400 }
      );
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text' },
        { status: 400 }
      );
    }

    if (!adminId || typeof adminId !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid adminId' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!isValidWalletAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Sanitize message text
    const sanitizedText = sanitizeMessageText(text, MAX_MESSAGE_LENGTH);
    if (sanitizedText.length === 0) {
      return NextResponse.json(
        { error: 'Message text is empty after sanitization' },
        { status: 400 }
      );
    }

    // Get session
    let session;
    if (sessionId) {
      // Verify session exists
      const result = await query(
        `SELECT id FROM chatbot_sessions WHERE id = $1 AND user_wallet_address = $2`,
        [sessionId, walletAddress]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Session not found or does not belong to this wallet' },
          { status: 404 }
        );
      }

      session = { id: sessionId };
    } else {
      // Get latest session for wallet
      session = await getLatestSessionByWallet(walletAddress);

      if (!session) {
        return NextResponse.json(
          { error: 'No session found for this wallet address' },
          { status: 404 }
        );
      }
    }

    // Create admin message
    const message = await createSupportMessage({
      sessionId: session.id,
      walletAddress,
      type: 'admin',
      text: sanitizedText,
      adminId,
      adminUsername: adminUsername || undefined,
    });

    // Update session metadata
    await query(
      `UPDATE chatbot_sessions
       SET last_admin_message_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [session.id]
    );

    // Remove typing indicator for this admin
    await query(
      `DELETE FROM typing_indicators
       WHERE user_wallet_address = $1 AND admin_id = $2`,
      [walletAddress, adminId]
    );

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        type: message.type,
        text: message.text,
        admin_username: message.admin_username,
        created_at: message.created_at,
        is_read: message.is_read,
      },
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error sending admin message:', error);

    // Check if it's a database error
    if (error instanceof Error) {
      if (error.message.includes('foreign key')) {
        return NextResponse.json(
          { error: 'Invalid session ID' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
