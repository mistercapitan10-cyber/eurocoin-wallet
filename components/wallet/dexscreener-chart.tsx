"use client";

import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface DexscreenerChartProps {
  tokenAddress?: string;
}

export function DexscreenerChart({ tokenAddress }: DexscreenerChartProps) {
  const t = useTranslation();

  // Use the token address from env or fallback
  const address = tokenAddress || process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0x88F43B9f5A6d4ADEF8f80D646732F5b6153C2586";
  
  // Create Dexscreener embed URL
  const dexUrl = `https://dexscreener.com/ethereum/${address}?embed=1&theme=light&trades=0&info=0`;

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
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
        <div className="relative" style={{ paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
          <iframe
            src={dexUrl}
            className="absolute top-0 left-0 h-full w-full border-0"
            title="Dexscreener Chart"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </CardContent>
    </Card>
  );
}

