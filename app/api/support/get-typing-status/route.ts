import { NextRequest, NextResponse } from 'next/server';
import { getTypingIndicator } from '@/lib/database/support-queries';
import { isValidWalletAddress } from '@/lib/telegram/notify-admin';

/**
 * GET /api/support/get-typing-status
 * Gets the current typing status for a user's chat
 * Query params:
 * - walletAddress: User's wallet address (required)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');

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

    // Get typing indicator
    const indicator = await getTypingIndicator(walletAddress);

    if (indicator) {
      return NextResponse.json({
        isTyping: true,
        adminUsername: indicator.admin_username || 'Администратор',
        startedAt: indicator.started_at,
      });
    }

    return NextResponse.json({
      isTyping: false,
    });
  } catch (error) {
    console.error('Error getting typing status:', error);

    return NextResponse.json(
      { error: 'Failed to get typing status' },
      { status: 500 }
    );
  }
}
