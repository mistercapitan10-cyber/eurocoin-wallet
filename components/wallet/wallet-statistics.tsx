"use client";

import { useAccount } from "wagmi";
import { useTranslation } from "@/hooks/use-translation";
import { useWalletStatistics } from "@/hooks/use-wallet-statistics";

export function WalletStatistics() {
  const { address, isConnected } = useAccount();
  const { totalSpent, cancelledAmount, isLoading, error } = useWalletStatistics();
  const t = useTranslation();

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

      <div className="flex flex-col gap-3 md:flex-row">
        {/* Total Spent */}
        <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt flex-1 rounded-xl border border-outline bg-surface p-4">
          <p className="dark:text-dark-foregroundMuted mb-1 text-xs uppercase tracking-[0.25em] text-foregroundMuted">
            {t("wallet.statistics.totalSpent")}
          </p>
          <p className="dark:text-dark-foreground text-2xl font-bold text-foreground">
            {isLoading
              ? t("wallet.statistics.loading")
              : `${parseFloat(totalSpent).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETH`}
          </p>
        </div>

        {/* Cancelled/Refunded Amount */}
        <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt flex-1 rounded-xl border border-outline bg-surface p-4">
          <p className="dark:text-dark-foregroundMuted mb-1 text-xs uppercase tracking-[0.25em] text-foregroundMuted">
            {t("wallet.statistics.cancelledAmount")}
          </p>
          <p className="text-2xl font-bold text-red-500 line-through decoration-red-500 decoration-2 dark:text-red-400">
            {isLoading
              ? t("wallet.statistics.loading")
              : `${parseFloat(cancelledAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETH`}
          </p>
        </div>
      </div>
    </div>
  );
}
