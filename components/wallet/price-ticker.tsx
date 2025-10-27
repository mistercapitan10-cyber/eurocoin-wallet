"use client";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTokenPrice } from "@/hooks/use-token-price";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/components/providers/language-provider";

export function PriceTicker() {
  const { priceUsd, source, isLoading, isFetching, error, refetch, fetchedAt } = useTokenPrice({
    refetchInterval: 60_000,
  });
  const { locale } = useLanguage();
  const t = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // This is a standard pattern to prevent hydration mismatch
    // eslint-disable-next-line
  }, []);

  const formatPrice = useMemo(
    () => (price: number | null) =>
      price === null
        ? "—"
        : new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: price >= 1 ? 2 : 6,
          }).format(price),
    [locale],
  );

  const timestamp = useMemo(() => {
    // Prevent hydration mismatch by showing placeholder until mounted
    if (!isMounted || !fetchedAt) {
      return "—";
    }

    try {
      return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "UTC",
      }).format(new Date(fetchedAt));
    } catch {
      return "—";
    }
  }, [fetchedAt, locale, isMounted]);

  const sourceLabel = source === "coingecko" ? "CoinGecko" : t("wallet.balanceCard.staticSource");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">{t("wallet.priceTicker.title")}</CardTitle>
          <CardDescription className="text-xs">
            {t("wallet.priceTicker.description")}
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            void refetch();
          }}
          disabled={isFetching}
        >
          {isFetching ? t("common.buttons.update") : t("wallet.balanceCard.refresh")}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <div className="h-6 w-24 animate-pulse rounded bg-white/40 dark:bg-white/20" />
            <div className="h-4 w-36 animate-pulse rounded bg-white/40 dark:bg-white/20" />
          </div>
        ) : (
          <div className="dark:text-dark-foregroundMuted flex flex-col gap-2 text-sm text-foregroundMuted">
            <span className="text-2xl font-medium text-accent">{formatPrice(priceUsd)}</span>
            <span>{t("wallet.priceTicker.source", { source: sourceLabel })}</span>
            <span>{t("wallet.priceTicker.updated", { time: timestamp })}</span>
            {error ? (
              <span className="text-xs text-accentAlt">{t("wallet.priceTicker.fallback")}</span>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
