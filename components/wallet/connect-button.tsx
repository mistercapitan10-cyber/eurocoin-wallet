"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { useTranslation } from "@/hooks/use-translation";

export function ConnectButton() {
  const { isConnected, isConnecting, connect, canConnect, connectorName, connectError } =
    useWalletConnection();
  const { show } = useToast();
  const [localError, setLocalError] = useState<string | null>(null);
  const t = useTranslation();

  if (isConnected) {
    return null;
  }

  const handleConnect = async () => {
    try {
      setLocalError(null);
      await connect();
      show({
        title: t("wallet.connectSuccessTitle"),
        description: t("wallet.connectSuccessDescription"),
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось подключить кошелёк.";
      setLocalError(message);
      show({
        title: t("wallet.error"),
        description: message,
        variant: "error",
      });
    }
  };

  const errorMessage = localError ?? connectError?.message ?? null;

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={handleConnect} disabled={!canConnect || isConnecting} fullWidth>
        {isConnecting ? t("wallet.connecting") : t("wallet.connect")}
      </Button>
      <div className="flex flex-col gap-2 text-sm text-foregroundMuted">
        <span>{t("wallet.connector", { connector: connectorName ?? "—" })}</span>
        {!canConnect ? <span className="text-accentAlt">{t("wallet.install")}</span> : null}
        {errorMessage ? <span className="text-accentAlt">{errorMessage}</span> : null}
      </div>
    </div>
  );
}
