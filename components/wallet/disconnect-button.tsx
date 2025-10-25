"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export function DisconnectButton() {
  const { isConnected, isDisconnecting, disconnect } = useWalletConnection();
  const { show } = useToast();
  const router = useRouter();

  if (!isConnected) {
    return null;
  }

  const handleDisconnect = async () => {
    try {
      await disconnect();
      // Remove authentication cookie
      Cookies.remove('metamask_connected');
      show({
        title: "Кошелёк отключён",
        description: "Подключение MetaMask завершено. Перенаправляем на страницу входа...",
        variant: "default",
      });
      // Redirect to login page after disconnection
      setTimeout(() => {
        router.push("/login");
      }, 1500);
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
