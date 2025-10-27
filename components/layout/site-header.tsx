"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ProfileIcon } from "@/components/layout/profile-icon";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/components/providers/language-provider";

const navItems = [
  { href: "/#exchange", key: "common.nav.exchange" },
  { href: "/#contact", key: "common.nav.contact" },
  { href: "/#investigation", key: "common.nav.investigation" },
  { href: "/#wallet", key: "common.nav.wallet" },
  { href: "/#token-balance", key: "common.nav.token" },
  { href: "/#faq", key: "common.nav.faq" },
];

function MobileLanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (newLocale: "ru" | "en") => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".language-dropdown")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="language-dropdown relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="dark:bg-dark-surfaceAlt dark:text-dark-foreground dark:hover:bg-dark-surface flex h-10 w-10 items-center justify-center rounded-full bg-surfaceAlt text-foreground transition hover:bg-surface"
        aria-label="Выбрать язык"
      >
        <svg
          width="20"
          height="20"
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
        <div className="dark:border-dark-outline dark:bg-dark-surface absolute right-0 top-12 z-50 min-w-[120px] rounded-lg border border-outline bg-surface p-2 shadow-lg">
          <button
            type="button"
            onClick={() => handleChange("ru")}
            className={cn(
              "dark:text-dark-foreground dark:hover:bg-dark-surfaceAlt flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition hover:bg-surfaceAlt",
              locale === "ru" ? "bg-accent/10 text-accent dark:bg-accent/20" : "text-foreground",
            )}
          >
            <span>Русский</span>
            {locale === "ru" && (
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
          <button
            type="button"
            onClick={() => handleChange("en")}
            className={cn(
              "dark:text-dark-foreground dark:hover:bg-dark-surfaceAlt flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition hover:bg-surfaceAlt",
              locale === "en" ? "bg-accent/10 text-accent dark:bg-accent/20" : "text-foreground",
            )}
          >
            <span>English</span>
            {locale === "en" && (
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
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const t = useTranslation();
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["exchange", "contact", "wallet", "investigation", "token-balance", "faq"];
      const scrollPosition = window.scrollY;
      const offset = 200; // Offset before considering section as active
      
      let activeSection = "";

      // Go through sections in reverse order to find the last one we've scrolled past
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const element = document.getElementById(section);
        
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + window.scrollY;
          
          // If scroll position is past the start of this section (with offset)
          if (scrollPosition >= elementTop - offset) {
            activeSection = section;
            break;
          }
        }
      }

      // Special case: if we're at the very top, don't highlight anything
      if (scrollPosition < 100) {
        setActiveSection("");
      } else {
        setActiveSection(activeSection);
      }
    };

    // Check initial position
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.href === "/") {
      return activeSection === "";
    }
    const hash = item.href.replace("/#", "");
    return activeSection === hash;
  };

  return (
    <header className="dark:border-dark-outline dark:bg-dark-surface/95 sticky top-0 z-50 border-b border-outline bg-surface/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="EuroCoin Logo"
            className="h-8 w-8 rounded-xl object-contain md:h-10 md:w-10 md:rounded-2xl"
          />
          <span className="dark:text-dark-foreground font-display text-xs uppercase tracking-[0.32em] text-foreground md:text-lg">
            EuroCoin
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="dark:text-dark-foregroundMuted hidden items-center gap-3 text-sm font-medium text-foregroundMuted md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 transition",
                isActive(item)
                  ? "bg-accent text-white shadow"
                  : "dark:hover:bg-dark-backgroundAlt hover:bg-backgroundAlt",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        {/* Desktop Right Side */}
        <div className="hidden items-center gap-3 md:flex">
          <ProfileIcon />
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        {/* Mobile Right Side */}
        <div className="flex shrink-0 items-center gap-1.5 md:hidden">
          <ProfileIcon />
          <ThemeToggle />
          <MobileLanguageSwitcher />
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="dark:text-dark-foregroundMuted mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-6 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-foregroundMuted md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full border px-3 py-2",
              isActive(item)
                ? "border-accent text-accent"
                : "dark:border-dark-outline border-outline",
            )}
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>
    </header>
  );
}
