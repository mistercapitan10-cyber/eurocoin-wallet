"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/components/providers/language-provider";

const navItems = [
  { href: "/", key: "common.nav.dashboard" },
  { href: "/#exchange", key: "common.nav.exchange" },
  { href: "/#contact", key: "common.nav.contact" },
  { href: "/#reviews", key: "common.nav.reviews" },
  { href: "/#token-balance", key: "common.nav.token" },
  { href: "/#faq", key: "common.nav.faq" },
];

function MobileLanguageSwitcher(): JSX.Element {
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
        className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground dark:hover:bg-dark-surfaceAlt flex h-10 w-10 items-center justify-center rounded-full border border-outline bg-surface text-foreground transition hover:bg-surfaceAlt"
        aria-label="Выбрать язык"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="dark:border-dark-outline dark:bg-dark-surface absolute right-0 top-12 z-50 rounded-lg border border-outline bg-surface shadow-lg">
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleChange("ru")}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2 text-sm transition",
                locale === "ru"
                  ? "bg-accent text-white"
                  : "dark:text-dark-foreground dark:hover:bg-dark-surfaceAlt text-foreground hover:bg-surfaceAlt",
              )}
            >
              <span className="text-xs">🇷🇺</span>
              Русский
            </button>
            <button
              type="button"
              onClick={() => handleChange("en")}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2 text-sm transition",
                locale === "en"
                  ? "bg-accent text-white"
                  : "dark:text-dark-foreground dark:hover:bg-dark-surfaceAlt text-foreground hover:bg-surfaceAlt",
              )}
            >
              <span className="text-xs">🇺🇸</span>
              English
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteHeader(): JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslation();
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["exchange", "contact", "reviews", "token-balance", "faq"];
      const scrollPosition = window.scrollY + 100; // Offset for header

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + window.scrollY;
          const elementBottom = elementTop + rect.height;

          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            setActiveSection(section);
            return;
          }
        }
      }

      // If we're at the top of the page, set dashboard as active
      if (window.scrollY < 200) {
        setActiveSection("");
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
            className="h-10 w-10 rounded-2xl object-contain"
          />
          <span className="dark:text-dark-foreground font-display text-lg uppercase tracking-[0.32em] text-foreground">
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
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        {/* Mobile Right Side */}
        <div className="flex items-center gap-2 md:hidden">
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
