"use client";

import { useTransition } from "react";
import { availableLocales, type Locale } from "@/lib/i18n/translations";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher(): JSX.Element {
  const { locale, setLocale } = useLanguage();
  const [isPending, startTransition] = useTransition();

  const handleChange = (nextLocale: Locale) => {
    startTransition(() => {
      setLocale(nextLocale);
    });
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-outline bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
      {availableLocales.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => handleChange(item)}
          className={cn(
            "rounded-full px-3 py-1 transition",
            locale === item ? "bg-accent text-white shadow" : "text-foregroundMuted hover:bg-backgroundAlt",
          )}
          disabled={isPending}
        >
          {item === "ru" ? "RU" : "EN"}
        </button>
      ))}
    </div>
  );
}
