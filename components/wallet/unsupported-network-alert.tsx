"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { DEFAULT_CHAIN } from "@/config/chains";
import { useSupportedNetwork } from "@/hooks/use-supported-network";
import { useTranslation } from "@/hooks/use-translation";

export function UnsupportedNetworkAlert() {
  const { isSupported, unsupportedChainName, switchToDefault, isSwitching, isConnected } =
    useSupportedNetwork();
  const t = useTranslation();
  const autoSwitchAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isConnected || isSupported || autoSwitchAttemptedRef.current) {
      return;
    }

    autoSwitchAttemptedRef.current = true;

    switchToDefault()
      .then(() => {
        toast.success(`Автоматически переключено на сеть: ${DEFAULT_CHAIN.name}`);
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Не удалось автоматически переключить сеть.";
        toast.error(message);
      });
  }, [isConnected, isSupported, switchToDefault]);

  if (!isConnected || isSupported) {
    return null;
  }

  return (
    <div className="dark:text-dark-foreground rounded-2xl border border-accentAlt/40 bg-accentAlt/10 px-5 py-4 text-sm text-foreground shadow-card dark:border-accentAlt/60 dark:bg-accentAlt/20">
      <div className="flex flex-col gap-3">
        <div>
          <p className="dark:text-dark-foreground font-semibold text-foreground">
            {t("wallet.networkAlert.title")}
          </p>
          <p className="dark:text-dark-foregroundMuted mt-1 text-foregroundMuted">
            {unsupportedChainName
              ? t("wallet.networkAlert.message", { chain: unsupportedChainName })
              : t("wallet.networkAlert.message", { chain: DEFAULT_CHAIN.name })}
          </p>
        </div>
        <div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              switchToDefault().catch((error) => {
                const message =
                  error instanceof Error ? error.message : "Не удалось переключить сеть.";
                toast.error(message);
              });
            }}
            disabled={isSwitching}
          >
            {isSwitching
              ? t("common.buttons.update")
              : t("wallet.networkAlert.button", { chain: DEFAULT_CHAIN.name })}
          </Button>
        </div>
      </div>
    </div>
  );
}
