"use client";

import Link from "next/link";

export function EmailIcon() {
  return (
    <Link
      href="mailto:eurocoinfinance@gmail.com"
      className="dark:bg-dark-surfaceAlt dark:text-dark-foreground dark:hover:bg-dark-surface flex h-8 w-8 items-center justify-center rounded-full bg-surfaceAlt text-foreground transition hover:bg-surface"
      aria-label="Send email"
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
    </Link>
  );
}
