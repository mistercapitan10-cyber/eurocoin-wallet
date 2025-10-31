import { NextRequest, NextResponse } from 'next/server';
import { getChatHistory } from '@/lib/database/support-queries';
import { isValidWalletAddress } from '@/lib/telegram/notify-admin';

/**
 * GET /api/support/get-chat-history
 * Fetches recent chat history for a wallet (used by Telegram bot)
 * Query params:
 * - walletAddress: User's wallet address (required)
 * - limit: Number of messages to fetch (optional, default 10)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

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

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Fetch chat history
    const messages = await getChatHistory(walletAddress, limit);

    // Format messages for response
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      type: msg.type,
      text: msg.text,
      adminUsername: msg.admin_username,
      createdAt: msg.created_at,
    }));

    return NextResponse.json({
      messages: formattedMessages,
      count: formattedMessages.length,
    });
  } catch (error) {
    console.error('Error getting chat history:', error);

    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
