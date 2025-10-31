"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { useLanguage } from "@/components/providers/language-provider";
import { ChatWindow } from "./chat-window";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  delay?: number; // Delay in milliseconds (default: 10000)
  position?: "bottom-right" | "bottom-left";
}

export function ChatWidget({ delay = 10000, position = "bottom-right" }: ChatWidgetProps) {
  const pathname = usePathname();
  const { isConnected, address } = useWalletConnection();
  const { locale } = useLanguage();
  const [showWindow, setShowWindow] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Track if we've shown notification for this address
  const [hasShownNotification, setHasShownNotification] = useState(false);
  const previousAddress = useRef<string | undefined>(undefined);

  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error("[ChatWidget] Error playing notification sound:", error);
    }
  };

  // Reset notification state when address changes using delayed setState
  useEffect(() => {
    if (address && address !== previousAddress.current && previousAddress.current !== undefined) {
      console.log("[ChatWidget] Address changed from", previousAddress.current, "to", address);
      // Use setTimeout to avoid synchronous setState
      const timer = setTimeout(() => {
        setHasShownNotification(false);
        setShowNotification(false);
      }, 0);
      previousAddress.current = address;
      return () => clearTimeout(timer);
    }
    previousAddress.current = address;
  }, [address]);

  useEffect(() => {
    console.log("[ChatWidget] Effect running:", {
      isConnected,
      address,
      previousAddress: previousAddress.current,
      hasShownNotification,
    });

    // Only run effect when connected
    if (!isConnected) {
      console.log("[ChatWidget] Not connected yet, waiting...");
      return;
    }

    // Only show notification once per address
    if (hasShownNotification) {
      console.log("[ChatWidget] Notification already shown for this address");
      return;
    }

    console.log("[ChatWidget] Starting timer for widget appearance, delay:", delay);

    // Show after delay
    const timer = setTimeout(() => {
      console.log("[ChatWidget] Timer fired, showing widget and notification");
      setShowNotification(true);
      setHasShownNotification(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isConnected, delay, hasShownNotification, address]);

  // Auto-hide notification after 15 seconds and play sound when it appears
  useEffect(() => {
    if (!showNotification) return;

    console.log("[ChatWidget] Notification shown, will auto-hide in 15 seconds");

    // Play notification sound
    playNotificationSound();

    const timer = setTimeout(() => {
      console.log("[ChatWidget] Auto-hiding notification");
      setShowNotification(false);
    }, 15000);

    return () => clearTimeout(timer);
  }, [showNotification]);

  // Don't show if not connected or on support page
  if (!isConnected || pathname === "/support") {
    return null;
  }

  const positionClasses = {
    "bottom-right": "bottom-5 right-5",
    "bottom-left": "bottom-5 left-5",
  };

  return (
    <>
      {/* Chat Window */}
      {showWindow && (
        <div className="fixed bottom-24 right-5 z-50">
          <ChatWindow userAddress={address} />
        </div>
      )}

      {/* Notification Bubble - positioned absolutely above the button */}
      {showNotification && !showWindow && (
        <div
          className={cn(
            "fixed z-50 w-80",
            positionClasses[position],
            "animate-in fade-in slide-in-from-bottom-2 mb-20",
          )}
        >
          <div className="relative rounded-lg bg-blue-600 px-4 py-3 shadow-xl">
            <button
              onClick={() => setShowNotification(false)}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-800 text-white hover:bg-blue-900"
              aria-label="Закрыть уведомление"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="flex items-start gap-3 pr-6">
              {/* Specialist Avatar */}
              <div className="relative mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/specialist.png"
                  alt="Specialist"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {locale === "ru" ? "Алексей" : "Alexey"}
                </p>
                <p className="text-xs text-blue-100">
                  {locale === "ru"
                    ? "Стали жертвой мошенничества? С помощью прямого доступа к Ethereum и кошельку MetaMask, мы можем провести прямое расследование подозрительных транзакций."
                    : "Became a victim of fraud? With direct access to Ethereum and MetaMask wallet, we can conduct a direct investigation of suspicious transactions."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Float Button or Close Button - fixed position, doesn't move */}
      <div className={cn("fixed z-50", positionClasses[position])}>
        {!showWindow && (
          <button
            onClick={() => {
              setShowWindow(true);
              setShowNotification(false);
            }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg"
            aria-label="Открыть чат"
          >
            <MessageCircle className="h-7 w-7" />
          </button>
        )}

        {showWindow && (
          <button
            onClick={() => {
              setShowWindow(false);
              setShowNotification(false);
            }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg"
            aria-label="Закрыть чат"
          >
            <X className="h-7 w-7" />
          </button>
        )}
      </div>
    </>
  );
}
