'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setTimeout(() => {
      setMounted(true)
    }, 100);
  }, [])

  if (!mounted) {
    return (
      <button
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-outline bg-surface text-foreground transition-colors hover:bg-surfaceAlt focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        aria-label="Toggle theme"
      >
        <span className="sr-only">Toggle theme</span>
        {/* Placeholder icon while loading */}
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-outline bg-surface text-foreground transition-all hover:bg-surfaceAlt hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground dark:hover:bg-dark-surfaceAlt"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="sr-only">Toggle theme</span>

      {/* Sun Icon (Light Mode) */}
      <svg
        className={`absolute h-4 w-4 transition-all ${
          theme === 'dark'
            ? 'rotate-90 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>

      {/* Moon Icon (Dark Mode) */}
      <svg
        className={`absolute h-4 w-4 transition-all ${
          theme === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    </button>
  )
}
