"use client";

import { useMemo, useState, useEffect } from "react";
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // This is a standard pattern to prevent hydration mismatch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Prevent hydration mismatch
  const displayConnector = isMounted ? connectorName ?? "—" : "—";
  const displayNetwork = isMounted ? currentChainName ?? "—" : "—";

  return (
    <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt dark:text-dark-foregroundMuted flex items-center gap-3 rounded-2xl border border-outline bg-surfaceAlt px-4 py-3 text-sm text-foregroundMuted">
      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${badgeColor}`} />
      <div className="flex flex-col gap-1">
        <span className="dark:text-dark-foregroundMuted text-xs uppercase tracking-[0.25em] text-foregroundMuted">
          {t("wallet.status.label")}
        </span>
        <span className="dark:text-dark-foreground font-medium text-foreground">{label}</span>
        <div className="dark:text-dark-foregroundMuted flex flex-wrap items-center gap-3 text-xs text-foregroundMuted">
          <span>{t("wallet.status.connector", { connector: displayConnector })}</span>
          <span>{t("wallet.status.network", { network: displayNetwork })}</span>
        </div>
        {isConnected && address ? (
          <div className="dark:text-dark-foreground flex flex-wrap items-center gap-3 text-xs text-foreground">
            <span className="dark:text-dark-foregroundMuted uppercase tracking-[0.25em] text-foregroundMuted">
              {t("wallet.status.connectedAddress")}
            </span>
            <span className="font-mono text-sm">{shortenAddress(address, 4)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
