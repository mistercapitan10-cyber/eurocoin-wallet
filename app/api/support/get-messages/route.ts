import { NextRequest, NextResponse } from 'next/server';
import {
  getMessagesBySession,
  getLatestSessionByWallet,
  markMessagesAsRead,
  resetSessionUnreadCount,
} from '@/lib/database/support-queries';
import { isValidWalletAddress } from '@/lib/telegram/notify-admin';

/**
 * GET /api/support/get-messages
 * Fetches support messages for a user's session
 * Query params:
 * - walletAddress: User's wallet address (required)
 * - sessionId: Session ID (optional, will use latest if not provided)
 * - limit: Number of messages to fetch (optional, default 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Validation
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing walletAddress parameter' },
        { status: 400 }
      );
    }

    if (!isValidWalletAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 500) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 500' },
        { status: 400 }
      );
    }

    // Get session
    let session;
    if (sessionId) {
      session = { id: sessionId };
    } else {
      session = await getLatestSessionByWallet(walletAddress);
    }

    // If no session exists, return empty array
    if (!session) {
      return NextResponse.json({
        messages: [],
        sessionId: null,
      });
    }

    // Fetch messages
    const messages = await getMessagesBySession(session.id, limit);

    // Mark admin messages as read
    await markMessagesAsRead(session.id, 'admin');

    // Reset unread count
    await resetSessionUnreadCount(session.id);

    // Format messages for response
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      type: msg.type,
      text: msg.text,
      adminUsername: msg.admin_username,
      createdAt: msg.created_at,
      isRead: msg.is_read,
    }));

    return NextResponse.json({
      messages: formattedMessages,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error getting messages:', error);

    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
