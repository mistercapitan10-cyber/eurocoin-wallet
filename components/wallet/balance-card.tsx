"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TOKEN_CONFIG, isTokenConfigured } from "@/config/token";
import { useSupportedNetwork } from "@/hooks/use-supported-network";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { useTranslation } from "@/hooks/use-translation";

const formatBalance = (value: string | null): string => {
  if (!value) {
    return "—";
  }

  const [integer, fraction = ""] = value.split(".");
  const trimmedFraction = fraction.replace(/0+$/, "").slice(0, 6);

  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return trimmedFraction ? `${formattedInteger},${trimmedFraction}` : formattedInteger;
};

export function BalanceCard(): React.ReactElement {
  const { isConnected } = useWalletConnection();
  const { isSupported } = useSupportedNetwork();
  const t = useTranslation();
  const {
    formattedBalance,
    isLoading,
    isRefetching,
    error,
    refetch,
    symbol,
    isTokenInfoReady,
    isTokenInfoLoading,
    formattedUsdValue,
    priceSource,
    priceUsd,
    isPriceLoading,
    isPriceFetching,
    priceError,
  } = useTokenBalance();

  const statusMessage = useMemo(() => {
    if (!isTokenConfigured) {
      return {
        title: t("wallet.balanceCard.status.notConfigured"),
        description: t("wallet.balanceCard.status.notConfigured"),
      };
    }

    if (!isConnected) {
      return {
        title: t("wallet.balanceCard.status.notConnected"),
        description: t("wallet.balanceCard.status.notConnected"),
      };
    }

    if (!isSupported) {
      return {
        title: t("wallet.networkAlert.title"),
        description: t("wallet.networkAlert.message", { chain: "Sepolia / Ethereum" }),
      };
    }

    if (!isTokenInfoReady && !isTokenInfoLoading) {
      return {
        title: t("wallet.balanceCard.status.infoUnavailable"),
        description: t("wallet.balanceCard.status.infoUnavailable"),
      };
    }

    if (error) {
      return {
        title: t("wallet.balanceCard.status.error"),
        description: error.message,
      };
    }

    return null;
  }, [
    error,
    isConnected,
    isSupported,
    isTokenInfoReady,
    isTokenInfoLoading,
    t,
  ]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-2">
          <CardTitle>{t("wallet.balanceCard.title")}</CardTitle>
          <CardDescription>{t("wallet.balanceCard.description")}</CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void refetch();
          }}
          disabled={isLoading || isRefetching || isPriceFetching || Boolean(statusMessage)}
        >
          {isRefetching || isPriceFetching ? t("common.buttons.update") : t("wallet.balanceCard.refresh")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-outline bg-surfaceAlt p-6">
          {statusMessage ? (
            <div className="flex flex-col gap-2 text-sm text-foregroundMuted">
              <p className="text-base font-semibold text-foreground">{statusMessage.title}</p>
              <p>{statusMessage.description}</p>
            </div>
          ) : isLoading || isPriceLoading ? (
            <div className="flex flex-col gap-5">
              <div className="h-8 w-1/3 animate-pulse rounded bg-white/40" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-white/40" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-white/40" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-4xl font-semibold text-foreground md:text-5xl">
                  {formatBalance(formattedBalance)}
                </span>
                <span className="ml-2 text-lg text-foregroundMuted">{symbol ?? TOKEN_CONFIG.symbol}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.25em] text-foregroundMuted">
                  {t("wallet.balanceCard.usdLabel")}
                </span>
                <span className="text-2xl font-medium text-accent">
                  {formattedUsdValue ?? "—"}
                </span>
                <span className="text-xs text-foregroundMuted">
                  {t("wallet.balanceCard.rate")}: {priceUsd ? priceUsd.toFixed(2) : "—"} USD · {" "}
                  {priceSource === "coingecko" ? "CoinGecko" : t("wallet.balanceCard.staticSource")}
                </span>
                {priceError ? (
                  <span className="text-xs text-accentAlt">
                    {t("wallet.balanceCard.fallbackRate")}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-foregroundMuted">
                {t("wallet.balanceCard.autoRefresh")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
