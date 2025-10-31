"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useUnreadCount } from "@/hooks/use-unread-count";

export function EmailIcon() {
  const { address } = useAccount();
  const { unreadCount } = useUnreadCount({
    walletAddress: address,
    enabled: !!address,
    pollingInterval: 5000, // Poll every 5 seconds
  });

  return (
    <Link
      href="/support"
      className="dark:bg-dark-surfaceAlt dark:text-dark-foreground dark:hover:bg-dark-surface relative flex h-8 w-8 items-center justify-center rounded-full bg-surfaceAlt text-foreground transition hover:bg-surface"
      aria-label="Open support chat"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
