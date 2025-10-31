"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { availableLocales, type Locale } from "@/lib/i18n/translations";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleChange = (nextLocale: Locale) => {
    startTransition(() => {
      setLocale(nextLocale);
      // Reload page to apply language changes
      setTimeout(() => {
        window.location.reload();
      }, 100);
    });
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="dark:bg-dark-surfaceAlt dark:text-dark-foreground dark:hover:bg-dark-surface flex h-8 w-8 items-center justify-center rounded-full bg-surfaceAlt text-foreground transition hover:bg-surface"
        aria-label="Switch language"
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
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </button>

      {isOpen && (
        <div className="dark:border-dark-outline dark:bg-dark-surface absolute right-0 top-10 z-50 min-w-[120px] rounded-lg border border-outline bg-surface p-2 shadow-lg">
          {availableLocales.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleChange(item)}
              disabled={isPending}
              className={cn(
                "dark:text-dark-foreground dark:hover:bg-dark-surfaceAlt flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition hover:bg-surfaceAlt",
                locale === item ? "bg-accent/10 text-accent dark:bg-accent/20" : "text-foreground",
              )}
            >
              <span>
                {({
                  ru: "Русский",
                  en: "English",
                  lt: "Lietuvių",
                  lv: "Latviešu",
                } as Record<Locale, string>)[item]}
              </span>
              {locale === item && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
