"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import {
  defaultLocale,
  getTranslation,
  type Locale,
  isLocale,
  translationsRaw,
} from "@/lib/i18n/translations";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  messages: typeof translationsRaw[Locale];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "meta-wallet-locale";

export function LanguageProvider({ children }: PropsWithChildren): JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextLocale);
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => getTranslation(locale, key, vars),
      messages: translationsRaw[locale],
    }),
    [locale, setLocale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
