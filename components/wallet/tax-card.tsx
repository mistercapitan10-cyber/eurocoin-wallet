"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTokenTax } from "@/hooks/use-token-tax";
import { useTranslation } from "@/hooks/use-translation";

const parseAmount = (value: string): number | null => {
  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

export function TaxCard() {
  const { formattedTax, taxPercent, source, refetch, isFetching, isLoading, error } = useTokenTax();
  const [amountInput, setAmountInput] = useState("100");
  const t = useTranslation();

  const amountValue = parseAmount(amountInput);
  const taxAmount = amountValue !== null ? (amountValue * taxPercent) / 100 : null;
  const totalAfterTax = taxAmount !== null ? amountValue - taxAmount : amountValue;

  const sourceLabel =
    source === "contract" ? t("wallet.taxCard.sourceContract") : t("wallet.taxCard.sourceFallback");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <CardTitle>{t("wallet.taxCard.title")}</CardTitle>
          <CardDescription>{t("wallet.taxCard.description")}</CardDescription>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            void refetch();
          }}
          disabled={isFetching}
        >
          {isFetching ? t("common.buttons.update") : t("wallet.balanceCard.refresh")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-outline bg-surfaceAlt p-4 text-sm text-foregroundMuted">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <div className="h-5 w-24 animate-pulse rounded bg-white/40" />
              <div className="h-4 w-40 animate-pulse rounded bg-white/40" />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.25em] text-foregroundMuted">
                {t("wallet.taxCard.current")}
              </span>
              <span className="text-2xl font-semibold text-accent">{formattedTax}</span>
              <span className="text-xs text-foregroundMuted">
                {t("wallet.priceTicker.source", { source: sourceLabel })}
              </span>
              {error ? (
                <span className="text-xs text-accentAlt">{t("wallet.taxCard.fallback")}</span>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs uppercase tracking-[0.25em] text-foregroundMuted">
              {t("wallet.taxCard.calculatorLabel")}
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.0001"
              className="w-full rounded-2xl border border-outline bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              placeholder={t("wallet.taxCard.placeholder")}
            />
          </label>
          {amountValue === null ? (
            <p className="text-xs text-accentAlt">{t("wallet.taxCard.invalid")}</p>
          ) : (
            <div className="flex flex-col gap-2 rounded-2xl border border-outline bg-surfaceAlt p-4 text-sm text-foregroundMuted">
              <div className="flex items-center justify-between">
                <span>{t("wallet.taxCard.resultFee", { tax: formattedTax })}</span>
                <span className="font-medium text-foreground">{taxAmount?.toFixed(4) ?? "0"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("wallet.taxCard.resultNet")}</span>
                <span className="font-medium text-foreground">
                  {totalAfterTax !== null ? totalAfterTax.toFixed(4) : "0"}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
