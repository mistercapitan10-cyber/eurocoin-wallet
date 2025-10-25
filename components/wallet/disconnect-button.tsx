"use client";

import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export function DisconnectButton() {
  const { isConnected, isDisconnecting, disconnect } = useWalletConnection();
  const router = useRouter();

  if (!isConnected) {
    return null;
  }

  const handleDisconnect = async () => {
    try {
      await disconnect();
      // Remove authentication cookie
      Cookies.remove("metamask_connected");
      toast.success("Подключение MetaMask завершено. Перенаправляем на страницу входа...");
      // Redirect to login page after disconnection
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось отключить MetaMask.";
      toast.error(message);
    }
  };

  return (
    <Button variant="outline" onClick={handleDisconnect} disabled={isDisconnecting}>
      {isDisconnecting ? "Отключение..." : "Отключить"}
    </Button>
  );
}
