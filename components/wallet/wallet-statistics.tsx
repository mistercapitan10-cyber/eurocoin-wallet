"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useTranslation } from "@/hooks/use-translation";
import { useWalletStatistics } from "@/hooks/use-wallet-statistics";
import { TOKEN_CONFIG } from "@/config/token";
import { useInternalBalance } from "@/hooks/use-internal-balance";

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

const formatTimestamp = (timestamp: number | undefined, fallback: string): string => {
  if (!timestamp) {
    return fallback;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp * 1000));
};

const formatIsoTimestamp = (value: string | null, locale = "ru-RU"): string => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
};

export function WalletStatistics() {
  const { address, isConnected } = useAccount();
  const { totalSpent, totalReceived, history, isLoading, error } = useWalletStatistics();
  const internalBalance = useInternalBalance();
  const t = useTranslation();
  const tokenSymbol = TOKEN_CONFIG.symbol || "TOKEN";
  const explorerTxUrl = EXPLORER_TX_BASE[TOKEN_CONFIG.chainId];
  const hasWalletConnection = Boolean(isConnected && address);

  const formattedHistory = useMemo(() => history.slice(0, HISTORY_LIMIT), [history]);

  const internalLedger = useMemo(
    () => internalBalance.ledger.slice(0, HISTORY_LIMIT),
    [internalBalance.ledger],
  );

  return (
    <div className="space-y-3">
      <h4 className="text-lg font-bold text-foreground dark:text-dark-foreground">
        {t("wallet.statistics.title")}
      </h4>

      {error && (
        <div className="rounded-lg border border-outline bg-backgroundAlt p-3 text-sm text-foregroundMuted dark:border-dark-outline dark:bg-dark-backgroundAlt dark:text-dark-foregroundMuted">
          {error}
        </div>
      )}

      {!hasWalletConnection && (
        <div className="rounded-xl border border-dashed border-outline bg-backgroundAlt/70 px-4 py-3 text-sm text-foregroundMuted dark:border-dark-outline dark:bg-dark-backgroundAlt dark:text-dark-foregroundMuted">
          {t("wallet.statistics.onchainUnavailable")}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-outline bg-surface p-4 dark:border-dark-outline dark:bg-dark-surfaceAlt">
          <p className="mb-1 text-xs uppercase tracking-[0.25em] text-foregroundMuted dark:text-dark-foregroundMuted">
            {t("wallet.statistics.totalSpent")}
          </p>
          <p className="text-2xl font-bold text-foreground dark:text-dark-foreground">
            {isLoading
              ? t("wallet.statistics.loading")
              : `${formatNumber(totalSpent)} ${tokenSymbol}`}
          </p>
        </div>

        <div className="rounded-xl border border-outline bg-surface p-4 dark:border-dark-outline dark:bg-dark-surfaceAlt">
          <p className="mb-1 text-xs uppercase tracking-[0.25em] text-foregroundMuted dark:text-dark-foregroundMuted">
            {t("wallet.statistics.receivedAmount")}
          </p>
          <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-300">
            {isLoading
              ? t("wallet.statistics.loading")
              : `${formatNumber(totalReceived)} ${tokenSymbol}`}
          </p>
        </div>

        <div className="rounded-xl border border-outline bg-surface p-4 dark:border-dark-outline dark:bg-dark-surfaceAlt">
          <p className="mb-1 text-xs uppercase tracking-[0.25em] text-foregroundMuted dark:text-dark-foregroundMuted">
            {t("wallet.statistics.history.title")}
          </p>
          <p className="text-sm text-foreground dark:text-dark-foreground">
            {t("wallet.statistics.history.caption")}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-outline bg-backgroundAlt p-4 dark:border-dark-outline dark:bg-dark-backgroundAlt">
        {!hasWalletConnection ? (
          <p className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
            {t("wallet.statistics.history.requiresWallet")}
          </p>
        ) : formattedHistory.length === 0 ? (
          <p className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
            {t("wallet.statistics.history.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-outline/50 dark:divide-dark-outline/60">
            {formattedHistory.map((entry, index) => {
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

              // Use combination of hash, blockNumber, and index for unique key
              const uniqueKey = `${entry.hash}-${entry.blockNumber}-${index}`;

              return (
                <li key={uniqueKey} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClasses}`}
                        >
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

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-outline bg-surface p-4 dark:border-dark-outline dark:bg-dark-surfaceAlt">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.25em] text-foregroundMuted dark:text-dark-foregroundMuted">
                {t("wallet.statistics.internal.title")}
              </p>
              <p className="text-3xl font-bold text-foreground dark:text-dark-foreground">
                {internalBalance.isLoading
                  ? t("wallet.statistics.internal.loading")
                  : `${internalBalance.availableFormatted} ${internalBalance.tokenSymbol}`}
              </p>
              <span className="text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
                {t("wallet.statistics.internal.available")}
              </span>
            </div>
            <span className="text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("wallet.statistics.internal.updated", {
                time: formatIsoTimestamp(internalBalance.updatedAt),
              })}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div className="flex flex-col rounded-xl border border-dashed border-outline/80 p-3 dark:border-dark-outline/80">
              <span className="text-foregroundMuted dark:text-dark-foregroundMuted">
                {t("wallet.statistics.internal.total")}
              </span>
              <span className="font-semibold text-foreground dark:text-dark-foreground">
                {internalBalance.totalFormatted} {internalBalance.tokenSymbol}
              </span>
            </div>
            <div className="flex flex-col rounded-xl border border-dashed border-outline/80 p-3 dark:border-dark-outline/80">
              <span className="text-foregroundMuted dark:text-dark-foregroundMuted">
                {t("wallet.statistics.internal.pending")}
              </span>
              <span className="font-semibold text-foreground dark:text-dark-foreground">
                {internalBalance.pendingFormatted} {internalBalance.tokenSymbol}
              </span>
            </div>
          </div>

          {internalBalance.error && (
            <p className="mt-3 text-xs text-red-500 dark:text-red-400">{internalBalance.error}</p>
          )}
        </div>

        <div className="rounded-2xl border border-outline bg-backgroundAlt p-4 dark:border-dark-outline dark:bg-dark-backgroundAlt">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-foregroundMuted dark:text-dark-foregroundMuted">
            {t("wallet.statistics.internal.historyTitle")}
          </p>

          {internalLedger.length === 0 ? (
            <p className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
              {internalBalance.isLoading
                ? t("wallet.statistics.internal.loading")
                : t("wallet.statistics.internal.empty")}
            </p>
          ) : (
            <ul className="space-y-3">
              {internalLedger.map((entry) => {
                const entryLabel = t(`wallet.statistics.internal.entry.${entry.entryType}`);
                const badgeClasses =
                  entry.direction === "credit"
                    ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-300"
                    : "bg-red-500/10 text-red-400";

                return (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-outline/60 bg-surfaceAlt p-3 dark:border-dark-outline/60 dark:bg-dark-surface"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClasses}`}
                        >
                          {entryLabel}
                        </span>
                        <span className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                          {entry.amount} {internalBalance.tokenSymbol}
                        </span>
                      </div>
                      {entry.reference ? (
                        <p className="text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
                          {entry.reference}
                        </p>
                      ) : null}
                      <div className="flex items-center justify-between text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
                        <span>{formatIsoTimestamp(entry.createdAt)}</span>
                        {entry.createdBy && <span>{entry.createdBy}</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
