"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useWalletConnection } from "@/hooks/use-wallet-connection";

export function DisconnectButton() {
  const { isConnected, isDisconnecting, disconnect } = useWalletConnection();
  const { show } = useToast();

  if (!isConnected) {
    return null;
  }

  const handleDisconnect = async () => {
    try {
      await disconnect();
      show({
        title: "Кошелёк отключён",
        description: "Подключение MetaMask завершено.",
        variant: "default",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось отключить MetaMask.";
      show({
        title: "Ошибка",
        description: message,
        variant: "error",
      });
    }
  };

  return (
    <Button variant="outline" onClick={handleDisconnect} disabled={isDisconnecting}>
      {isDisconnecting ? "Отключение..." : "Отключить"}
    </Button>
  );
}
