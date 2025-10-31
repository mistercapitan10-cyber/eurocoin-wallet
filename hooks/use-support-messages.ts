'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SupportMessage {
  id: string;
  type: 'user' | 'admin' | 'system';
  text: string;
  adminUsername?: string;
  createdAt: string;
  isRead: boolean;
}

interface UseSupportMessagesOptions {
  walletAddress?: `0x${string}`;
  enabled?: boolean;
  pollingInterval?: number; // milliseconds
}

interface UseSupportMessagesReturn {
  messages: SupportMessage[];
  sendMessage: (text: string) => Promise<void>;
  loading: boolean;
  sending: boolean;
  error: string | null;
  sessionId: string | null;
  refresh: () => Promise<void>;
  unreadCount: number;
}

export function useSupportMessages(
  options: UseSupportMessagesOptions = {}
): UseSupportMessagesReturn {
  const { walletAddress, enabled = true, pollingInterval = 3000 } = options;

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const previousMessageCountRef = useRef(0);

  // Load messages from API
  const loadMessages = useCallback(async () => {
    if (!walletAddress || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const url = new URL('/api/support/get-messages', window.location.origin);
      url.searchParams.append('walletAddress', walletAddress);
      if (sessionId) {
        url.searchParams.append('sessionId', sessionId);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      const fetchedMessages = data.messages || [];

      setMessages(fetchedMessages);
      setSessionId(data.sessionId || null);

      // Count unread admin messages
      const unread = fetchedMessages.filter(
        (msg: SupportMessage) => msg.type === 'admin' && !msg.isRead
      ).length;
      setUnreadCount(unread);

      // Track message count for new message detection
      previousMessageCountRef.current = fetchedMessages.length;
    } catch (err) {
      console.error('Error loading support messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [walletAddress, sessionId, enabled]);

  // Send message to support
  const sendMessage = useCallback(
    async (text: string) => {
      if (!walletAddress || !text.trim()) {
        return;
      }

      try {
        setSending(true);
        setError(null);

        const response = await fetch('/api/support/send-user-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress,
            text: text.trim(),
            sessionId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        const data = await response.json();

        // Update session ID if returned
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }

        // Reload messages to include the new one
        await loadMessages();
      } catch (err) {
        console.error('Error sending message:', err);
        setError(err instanceof Error ? err.message : 'Failed to send message');
        throw err;
      } finally {
        setSending(false);
      }
    },
    [walletAddress, sessionId, loadMessages]
  );

  // Set up polling
  useEffect(() => {
    if (!walletAddress || !enabled) {
      return;
    }

    // Initial load
    loadMessages();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      loadMessages();
    }, pollingInterval);

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [walletAddress, enabled, pollingInterval, loadMessages]);

  // Refresh function
  const refresh = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  return {
    messages,
    sendMessage,
    loading,
    sending,
    error,
    sessionId,
    refresh,
    unreadCount,
  };
}
