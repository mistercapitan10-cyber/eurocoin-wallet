"use client";

import { useMemo } from "react";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { useTranslation } from "@/hooks/use-translation";

export function WalletStatus() {
  const { status, connectorName, currentChainName, isConnected, isConnecting, isReconnecting } =
    useWalletConnection();
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
    <div className="flex items-center gap-3 rounded-2xl border border-outline bg-surfaceAlt px-4 py-3 text-sm text-foregroundMuted">
      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${badgeColor}`} />
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.25em] text-foregroundMuted">
          {t("wallet.status.label")}
        </span>
        <span className="font-medium text-foreground">{label}</span>
        <div className="flex flex-wrap items-center gap-3 text-xs text-foregroundMuted">
          <span>{t("wallet.status.connector", { connector: connectorName ?? "—" })}</span>
          <span>{t("wallet.status.network", { network: currentChainName ?? "—" })}</span>
        </div>
      </div>
    </div>
  );
}
