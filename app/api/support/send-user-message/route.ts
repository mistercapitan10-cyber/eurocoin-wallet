import { NextRequest, NextResponse } from 'next/server';
import {
  createSupportMessage,
  getOrCreateSession,
} from '@/lib/database/support-queries';
import { notifyAdminNewMessage, sanitizeMessageText, isValidWalletAddress } from '@/lib/telegram/notify-admin';

// Rate limiting map (simple in-memory implementation)
// TODO: Use Redis or similar for production
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_MESSAGE_LENGTH = 2000;

/**
 * POST /api/support/send-user-message
 * Sends a message from a user to support
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, text, sessionId } = body;

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

    // Validate wallet address format
    if (!isValidWalletAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Sanitize and validate message length
    const sanitizedText = sanitizeMessageText(text, MAX_MESSAGE_LENGTH);
    if (sanitizedText.length === 0) {
      return NextResponse.json(
        { error: 'Message text is empty after sanitization' },
        { status: 400 }
      );
    }

    // Rate limiting
    const now = Date.now();
    const userLimit = rateLimitMap.get(walletAddress);

    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
        }
        userLimit.count++;
      } else {
        // Reset window
        rateLimitMap.set(walletAddress, {
          count: 1,
          resetTime: now + RATE_LIMIT_WINDOW,
        });
      }
    } else {
      // First request
      rateLimitMap.set(walletAddress, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      });
    }

    // Get or create session
    let session;
    if (sessionId) {
      // Use provided session ID
      session = { id: sessionId };
    } else {
      // Get or create a new session
      session = await getOrCreateSession(walletAddress);
    }

    // Create support message
    const message = await createSupportMessage({
      sessionId: session.id,
      walletAddress,
      type: 'user',
      text: sanitizedText,
    });

    // Send notification to admin in Telegram
    // Note: This is a fire-and-forget operation
    notifyAdminNewMessage(walletAddress, sanitizedText).catch((error) => {
      console.error('Failed to send Telegram notification:', error);
      // Don't fail the request if notification fails
    });

    // Update session unread count (admin side)
    // This is handled by the trigger in the database, but we could also do it here

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        type: message.type,
        text: message.text,
        created_at: message.created_at,
        is_read: message.is_read,
      },
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error sending user message:', error);

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

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now >= value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
