"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useTranslation } from "@/hooks/use-translation";
import { useWalletStatistics } from "@/hooks/use-wallet-statistics";
import { TOKEN_CONFIG } from "@/config/token";

const HISTORY_LIMIT = 8;

const EXPLORER_TX_BASE: Record<number, string> = {
  1: "https://etherscan.io/tx/",
  11155111: "https://sepolia.etherscan.io/tx/",
};

const formatNumber = (value: string): string =>
  Number.parseFloat(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const shortenAddress = (value: string): string => {
  if (!value || value.length < 10) {
    return value || "—";
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const formatTimestamp = (
  timestamp: number | undefined,
  fallback: string,
): string => {
  if (!timestamp) {
    return fallback;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp * 1000));
};

export function WalletStatistics() {
  const { address, isConnected } = useAccount();
  const { totalSpent, totalReceived, history, isLoading, error } = useWalletStatistics();
  const t = useTranslation();
  const tokenSymbol = TOKEN_CONFIG.symbol || "TOKEN";
  const explorerTxUrl = EXPLORER_TX_BASE[TOKEN_CONFIG.chainId];

  const formattedHistory = useMemo(
    () => history.slice(0, HISTORY_LIMIT),
    [history],
  );

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="dark:text-dark-foreground text-lg font-bold text-foreground">
        {t("wallet.statistics.title")}
      </h4>

      {error && (
        <div className="dark:bg-dark-backgroundAlt dark:border-dark-outline dark:text-dark-foregroundMuted rounded-lg border border-outline bg-backgroundAlt p-3 text-sm text-foregroundMuted">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt rounded-xl border border-outline bg-surface p-4">
          <p className="dark:text-dark-foregroundMuted mb-1 text-xs uppercase tracking-[0.25em] text-foregroundMuted">
            {t("wallet.statistics.totalSpent")}
          </p>
          <p className="dark:text-dark-foreground text-2xl font-bold text-foreground">
            {isLoading
              ? t("wallet.statistics.loading")
              : `${formatNumber(totalSpent)} ${tokenSymbol}`}
          </p>
        </div>

        <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt rounded-xl border border-outline bg-surface p-4">
          <p className="dark:text-dark-foregroundMuted mb-1 text-xs uppercase tracking-[0.25em] text-foregroundMuted">
            {t("wallet.statistics.receivedAmount")}
          </p>
          <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-300">
            {isLoading
              ? t("wallet.statistics.loading")
              : `${formatNumber(totalReceived)} ${tokenSymbol}`}
          </p>
        </div>

        <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt rounded-xl border border-outline bg-surface p-4">
          <p className="dark:text-dark-foregroundMuted mb-1 text-xs uppercase tracking-[0.25em] text-foregroundMuted">
            {t("wallet.statistics.history.title")}
          </p>
          <p className="dark:text-dark-foreground text-sm text-foreground">
            {t("wallet.statistics.history.caption")}
          </p>
        </div>
      </div>

      <div className="dark:border-dark-outline dark:bg-dark-backgroundAlt rounded-2xl border border-outline bg-backgroundAlt p-4">
        {formattedHistory.length === 0 ? (
          <p className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
            {t("wallet.statistics.history.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-outline/50 dark:divide-dark-outline/60">
            {formattedHistory.map((entry) => {
              const amount = Number.parseFloat(
                formatUnits(entry.value, TOKEN_CONFIG.decimals),
              ).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              const isIncoming = entry.direction === "incoming";
              const badgeClasses = isIncoming
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-red-500/10 text-red-400";

              return (
                <li key={entry.hash} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClasses}`}>
                          {isIncoming
                            ? t("wallet.statistics.history.incoming")
                            : t("wallet.statistics.history.outgoing")}
                        </span>
                        <span className="text-lg font-semibold text-foreground dark:text-dark-foreground">
                          {amount}{" "}
                          <span className="text-sm font-normal text-foregroundMuted dark:text-dark-foregroundMuted">
                            {tokenSymbol}
                          </span>
                        </span>
                      </div>
                      <p className="text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
                        {t("wallet.statistics.history.counterparty")}:{" "}
                        {shortenAddress(entry.counterparty)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
                      <span>
                        {formatTimestamp(
                          entry.timestamp,
                          t("wallet.statistics.history.timestampUnknown"),
                        )}
                      </span>
                      {explorerTxUrl ? (
                        <a
                          href={`${explorerTxUrl}${entry.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent transition hover:opacity-80"
                        >
                          Etherscan
                        </a>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
