"use client";

import { shortenAddress } from "@/lib/address";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { useTranslation } from "@/hooks/use-translation";

export function WalletAddress() {
  const { address, isConnected } = useWalletConnection();
  const t = useTranslation();

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-outline bg-surfaceAlt px-4 py-3 text-sm text-foreground dark:border-dark-outline dark:bg-dark-surfaceAlt dark:text-dark-foreground">
      <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-[0.2em] text-foregroundMuted dark:text-dark-foregroundMuted">
          {t("wallet.status.connectedAddress")}
        </span>
        <span className="font-mono text-base text-foreground dark:text-dark-foreground">{shortenAddress(address)}</span>
      </div>
    </div>
  );
}
