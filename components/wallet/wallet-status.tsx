"use client";

import { useMemo } from "react";
import { shortenAddress } from "@/lib/address";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { useTranslation } from "@/hooks/use-translation";

export function WalletStatus() {
  const {
    status,
    connectorName,
    currentChainName,
    address,
    isConnected,
    isConnecting,
    isReconnecting,
  } = useWalletConnection();
  const t = useTranslation();

  const label = (() => {
    switch (status) {
      case "connected":
        return t("wallet.connectSuccessTitle");
      case "connecting":
        return t("wallet.connecting");
      case "reconnecting":
        return t("wallet.connecting");
      case "disconnected":
        return t("wallet.statusDisconnected");
      default:
        return status;
    }
  })();

  const badgeColor = useMemo(() => {
    if (isConnected) return "bg-accent";
    if (isConnecting || isReconnecting) return "bg-amber-400";
    return "bg-accentAlt";
  }, [isConnected, isConnecting, isReconnecting]);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-outline bg-surfaceAlt px-4 py-3 text-sm text-foregroundMuted dark:border-dark-outline dark:bg-dark-surfaceAlt dark:text-dark-foregroundMuted">
      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${badgeColor}`} />
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.25em] text-foregroundMuted dark:text-dark-foregroundMuted">
          {t("wallet.status.label")}
        </span>
        <span className="font-medium text-foreground dark:text-dark-foreground">{label}</span>
        <div className="flex flex-wrap items-center gap-3 text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
          <span>{t("wallet.status.connector", { connector: connectorName ?? "—" })}</span>
          <span>{t("wallet.status.network", { network: currentChainName ?? "—" })}</span>
        </div>
        {isConnected && address ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground dark:text-dark-foreground">
            <span className="uppercase tracking-[0.25em] text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("wallet.status.connectedAddress")}
            </span>
            <span className="font-mono text-sm">{shortenAddress(address, 4)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
