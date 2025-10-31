import { NextRequest, NextResponse } from 'next/server';
import { getUnreadCount } from '@/lib/database/support-queries';
import { isValidWalletAddress } from '@/lib/telegram/notify-admin';

/**
 * GET /api/support/get-unread-count
 * Gets the count of unread admin messages for a wallet
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

    // Get unread count
    const unreadCount = await getUnreadCount(walletAddress);

    return NextResponse.json({
      unreadCount,
      walletAddress,
    });
  } catch (error) {
    console.error('Error getting unread count:', error);

    return NextResponse.json(
      { error: 'Failed to get unread count' },
      { status: 500 }
    );
  }
}
