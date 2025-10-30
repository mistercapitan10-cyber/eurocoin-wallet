"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface DexscreenerChartProps {
  tokenAddress?: string;
}

export function DexscreenerChart({ tokenAddress }: DexscreenerChartProps) {
  const t = useTranslation();
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const prevThemeRef = useRef<string>("");
  const [isReloading, setIsReloading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Only render iframe after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get current theme (fallback to 'dark' if not mounted)
  const dexTheme = theme === "light" ? "light" : "dark";

  // Force iframe reload when theme changes with loading state
  useEffect(() => {
    if (prevThemeRef.current && prevThemeRef.current !== dexTheme) {
      setIsReloading(true);
      setIframeKey((prev) => prev + 1);

      // Reset loading state after iframe loads
      const timer = setTimeout(() => {
        setIsReloading(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
    prevThemeRef.current = dexTheme;
  }, [dexTheme]);

  // Use the token address from env or fallback
  const address =
    tokenAddress ||
    process.env.NEXT_PUBLIC_TOKEN_ADDRESS ||
    "0x88F43B9f5A6d4ADEF8f80D646732F5b6153C2586";

  // Create Dexscreener embed URL with theme control
  // Note: DexScreener's theme parameter affects the UI chrome but not the chart itself
  // Chart theme is typically controlled by user's chart settings stored in their localStorage
  const dexUrl = useMemo(() => {
    // Try multiple theme-related parameters
    const params = new URLSearchParams({
      embed: '1',
      theme: dexTheme,
      info: '0',
      trades: '0',
    });

    return `https://dexscreener.com/ethereum/${address}?${params.toString()}`;
  }, [address, dexTheme]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">{t("wallet.dexscreener.title")}</CardTitle>
          <CardDescription className="text-xs">
            {t("wallet.dexscreener.description")}
          </CardDescription>
        </div>
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
      </CardHeader>
      <CardContent>
        <div
          className="relative"
          style={{ paddingBottom: "56.25%", height: 0, overflow: "hidden" }}
        >
          {!isMounted ? (
            // Show skeleton while waiting for client-side mount
            <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading chart...</p>
              </div>
            </div>
          ) : (
            <>
              {isReloading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">
                      {t("wallet.dexscreener.switching")}
                    </p>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                key={`dex-${dexTheme}-${iframeKey}`}
                src={dexUrl}
                className="absolute left-0 top-0 h-full w-full border-0 transition-opacity duration-300"
                style={{ opacity: isReloading ? 0.3 : 1 }}
                title="Dexscreener Chart"
                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
