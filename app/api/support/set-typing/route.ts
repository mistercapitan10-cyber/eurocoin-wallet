import { NextRequest, NextResponse } from 'next/server';
import { setTypingIndicator } from '@/lib/database/support-queries';
import { isValidWalletAddress } from '@/lib/telegram/notify-admin';

/**
 * POST /api/support/set-typing
 * Sets or removes typing indicator for an admin
 * Body:
 * - walletAddress: User's wallet address (required)
 * - adminId: Admin's Telegram ID (required)
 * - adminUsername: Admin's username (optional)
 * - isTyping: Boolean indicating if admin is typing (required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, adminId, adminUsername, isTyping } = body;

    // Validation
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid walletAddress' },
        { status: 400 }
      );
    }

    if (!adminId || typeof adminId !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid adminId' },
        { status: 400 }
      );
    }

    if (typeof isTyping !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid isTyping' },
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

    // Set typing indicator
    await setTypingIndicator({
      walletAddress,
      adminId,
      adminUsername: adminUsername || undefined,
      isTyping,
    });

    return NextResponse.json({
      success: true,
      isTyping,
    });
  } catch (error) {
    console.error('Error setting typing status:', error);

    return NextResponse.json(
      { error: 'Failed to set typing status' },
      { status: 500 }
    );
  }
}
