"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { DEFAULT_CHAIN } from "@/config/chains";
import { useSupportedNetwork } from "@/hooks/use-supported-network";
import { useTranslation } from "@/hooks/use-translation";

export function UnsupportedNetworkAlert() {
  const { isSupported, unsupportedChainName, switchToDefault, isSwitching, isConnected } =
    useSupportedNetwork();
  const { show } = useToast();
  const t = useTranslation();
  const autoSwitchAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isConnected || isSupported || autoSwitchAttemptedRef.current) {
      return;
    }

    autoSwitchAttemptedRef.current = true;

    switchToDefault()
      .then(() => {
        show({
          title: t("wallet.networkAlert.title"),
          description: t("wallet.networkAlert.message", { chain: DEFAULT_CHAIN.name }),
          variant: "success",
        });
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Не удалось автоматически переключить сеть.";
        show({
          title: t("wallet.networkAlert.title"),
          description: message,
          variant: "error",
        });
      });
  }, [isConnected, isSupported, show, switchToDefault]);

  if (!isConnected || isSupported) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-accentAlt/40 bg-accentAlt/10 px-5 py-4 text-sm text-foreground shadow-card">
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-semibold text-foreground">{t("wallet.networkAlert.title")}</p>
          <p className="mt-1 text-foregroundMuted">
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
                show({
                  title: "Ошибка переключения",
                  description: message,
                  variant: "error",
                });
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
