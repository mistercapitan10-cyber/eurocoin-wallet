'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseUnreadCountOptions {
  walletAddress?: string;
  enabled?: boolean;
  pollingInterval?: number; // in milliseconds
}

interface UseUnreadCountReturn {
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to get and poll unread message count
 */
export function useUnreadCount(
  options: UseUnreadCountOptions = {}
): UseUnreadCountReturn {
  const {
    walletAddress,
    enabled = true,
    pollingInterval = 5000, // 5 seconds default
  } = options;

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!walletAddress || !enabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/support/get-unread-count?walletAddress=${encodeURIComponent(walletAddress)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // Silent fail - don't spam console with errors during polling
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Don't reset count on error to avoid flickering
    } finally {
      setLoading(false);
    }
  }, [walletAddress, enabled]);

  // Initial fetch
  useEffect(() => {
    if (enabled && walletAddress) {
      fetchUnreadCount();
    }
  }, [enabled, walletAddress, fetchUnreadCount]);

  // Polling
  useEffect(() => {
    if (!enabled || !walletAddress || pollingInterval <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, walletAddress, pollingInterval, fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    error,
    refresh: fetchUnreadCount,
  };
}
