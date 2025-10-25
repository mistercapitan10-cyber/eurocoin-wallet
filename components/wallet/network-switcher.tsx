"use client";

import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useSupportedNetwork } from "@/hooks/use-supported-network";
import { useTranslation } from "@/hooks/use-translation";

export function NetworkSwitcher() {
  const { supportedChains, activeChainId, isSwitching, switchToChain, canSwitch, isConnected } =
    useSupportedNetwork();
  const t = useTranslation();

  if (!isConnected) {
    return null;
  }

  const handleSwitch = async (targetChainId: number) => {
    if (targetChainId === activeChainId) {
      return;
    }

    try {
      await switchToChain(targetChainId);
      const chainName =
        supportedChains.find((chain) => chain.id === targetChainId)?.name ?? "выбранная сеть";
      toast.success(`Переключено на сеть: ${chainName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось переключить сеть.";
      toast.error(message);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="dark:text-dark-foregroundMuted text-xs uppercase tracking-[0.25em] text-foregroundMuted">
        {t("wallet.networkLabel")}
      </span>
      <div className="flex flex-wrap gap-2">
        {supportedChains.map((chain) => (
          <Button
            key={chain.id}
            variant={chain.id === activeChainId ? "secondary" : "outline"}
            size="sm"
            disabled={!canSwitch || isSwitching}
            onClick={() => handleSwitch(chain.id)}
          >
            {chain.name}
          </Button>
        ))}
      </div>
      {!canSwitch ? <span className="text-sm text-accentAlt">{t("wallet.install")}</span> : null}
    </div>
  );
}
