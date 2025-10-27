"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface DexscreenerChartProps {
  tokenAddress?: string;
}

export function DexscreenerChart({ tokenAddress }: DexscreenerChartProps) {
  const t = useTranslation();
  const toggleLockRef = useRef(false);

  // Load saved theme from localStorage or default to 'dark'
  const [dexTheme, setDexTheme] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dexTheme") || "dark";
    }
    return "dark";
  });

  // Save theme preference to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dexTheme", dexTheme);
    }
  }, [dexTheme]);

  // Toggle theme function with lock to prevent spam clicks
  const toggleDexTheme = () => {
    if (toggleLockRef.current) return;

    toggleLockRef.current = true;
    setDexTheme((prev) => (prev === "light" ? "dark" : "light"));

    setTimeout(() => {
      toggleLockRef.current = false;
    }, 600);
  };

  // Use the token address from env or fallback
  const address =
    tokenAddress ||
    process.env.NEXT_PUBLIC_TOKEN_ADDRESS ||
    "0x88F43B9f5A6d4ADEF8f80D646732F5b6153C2586";

  // Create Dexscreener embed URL with manual theme control
  const dexUrl = `https://dexscreener.com/ethereum/${address}?embed=1&theme=${dexTheme}&trades=0&info=0`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">{t("wallet.dexscreener.title")}</CardTitle>
          <CardDescription className="text-xs">
            {t("wallet.dexscreener.description")}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={toggleDexTheme}>
            {dexTheme === "light" ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            )}
            <span className="ml-2 hidden sm:inline">{dexTheme === "light" ? "Dark" : "Light"}</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(`https://dexscreener.com/ethereum/${address}`, "_blank")}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span className="ml-2 hidden sm:inline">{t("wallet.dexscreener.openFull")}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="relative"
          style={{ paddingBottom: "56.25%", height: 0, overflow: "hidden" }}
        >
          <iframe
            key={dexTheme} // Force reload when theme changes
            src={dexUrl}
            className="absolute left-0 top-0 h-full w-full border-0"
            title="Dexscreener Chart"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </CardContent>
    </Card>
  );
}
