'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TypingStatus {
  isTyping: boolean;
  adminUsername?: string;
  startedAt?: string;
}

interface UseTypingIndicatorOptions {
  walletAddress?: `0x${string}`;
  enabled?: boolean;
  checkInterval?: number; // milliseconds
}

interface UseTypingIndicatorReturn {
  isTyping: boolean;
  adminUsername: string;
}

export function useTypingIndicator(
  options: UseTypingIndicatorOptions = {}
): UseTypingIndicatorReturn {
  const { walletAddress, enabled = true, checkInterval = 1000 } = options;

  const [isTyping, setIsTyping] = useState(false);
  const [adminUsername, setAdminUsername] = useState('Администратор');

  const checkIntervalRef = useRef<NodeJS.Timeout>();

  // Check typing status from API
  const checkTypingStatus = useCallback(async () => {
    if (!walletAddress || !enabled) {
      return;
    }

    try {
      const url = new URL('/api/support/get-typing-status', window.location.origin);
      url.searchParams.append('walletAddress', walletAddress);

      const response = await fetch(url.toString());

      if (!response.ok) {
        // If API fails, just set typing to false
        setIsTyping(false);
        return;
      }

      const data: TypingStatus = await response.json();

      setIsTyping(data.isTyping || false);
      if (data.adminUsername) {
        setAdminUsername(data.adminUsername);
      }
    } catch (error) {
      // Silently fail - don't disrupt UX
      console.error('Error checking typing status:', error);
      setIsTyping(false);
    }
  }, [walletAddress, enabled]);

  // Set up polling
  useEffect(() => {
    if (!walletAddress || !enabled) {
      setIsTyping(false);
      return;
    }

    // Initial check
    checkTypingStatus();

    // Set up interval for checking
    checkIntervalRef.current = setInterval(() => {
      checkTypingStatus();
    }, checkInterval);

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [walletAddress, enabled, checkInterval, checkTypingStatus]);

  return {
    isTyping,
    adminUsername,
  };
}
