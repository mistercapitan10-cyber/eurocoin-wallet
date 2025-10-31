'use client';

import { useCallback, useRef, useEffect } from 'react';

interface UseNotificationSoundOptions {
  enabled?: boolean;
  volume?: number; // 0-1
  soundUrl?: string;
}

interface UseNotificationSoundReturn {
  playNotification: () => void;
  setVolume: (volume: number) => void;
  setEnabled: (enabled: boolean) => void;
}

export function useNotificationSound(
  options: UseNotificationSoundOptions = {}
): UseNotificationSoundReturn {
  const {
    enabled: initialEnabled = true,
    volume: initialVolume = 0.5,
    soundUrl = '/sounds/notification-bell.mp3',
  } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef(initialEnabled);
  const volumeRef = useRef(initialVolume);

  // Initialize audio element
  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(soundUrl);
    audioRef.current.volume = volumeRef.current;

    // Preload audio
    audioRef.current.load();

    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundUrl]);

  // Play notification sound
  const playNotification = useCallback(() => {
    if (!enabledRef.current || !audioRef.current) {
      return;
    }

    try {
      // Reset to beginning
      audioRef.current.currentTime = 0;

      // Play sound
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Auto-play was prevented
          console.warn('Notification sound blocked by browser:', error);
        });
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    volumeRef.current = clampedVolume;

    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  // Set enabled state
  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return {
    playNotification,
    setVolume,
    setEnabled,
  };
}
