"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useInternalBalance } from "@/hooks/use-internal-balance";
import { useWithdrawRequests } from "@/hooks/use-withdraw-requests";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  approved: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  processing: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
  completed: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-300",
  rejected: "bg-red-500/10 text-red-500 dark:text-red-400",
};

const isEthereumAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);

export function InternalPayoutForm() {
  const t = useTranslation();
  const { address } = useAccount();
  const internalBalance = useInternalBalance();
  const withdrawRequests = useWithdrawRequests();

  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorTranslations = {
    AUTH_REQUIRED: "internalPayout.error",
    DESTINATION_INVALID: "internalPayout.validation.destinationInvalid",
    INSUFFICIENT_FUNDS: "internalPayout.validation.insufficient",
    AMOUNT_REQUIRED: "internalPayout.validation.amount",
    INVALID_AMOUNT_FORMAT: "internalPayout.validation.amount",
    DESTINATION_BLOCKED: "internalPayout.validation.destinationBlocked",
    LIMIT_DAILY_EXCEEDED: "internalPayout.validation.dailyLimit",
    LIMIT_MONTHLY_EXCEEDED: "internalPayout.validation.monthlyLimit",
  } as const;

  useEffect(() => {
    const fallback =
      internalBalance.wallet?.defaultWithdrawAddress ??
      internalBalance.wallet?.walletAddress ??
      address ??
      "";
    setDestination((prev) => (prev ? prev : fallback));
  }, [address, internalBalance.wallet?.defaultWithdrawAddress, internalBalance.wallet?.walletAddress]);

  const availableFloat = useMemo(() => {
    try {
      return Number.parseFloat(internalBalance.availableFormatted);
    } catch {
      return 0;
    }
  }, [internalBalance.availableFormatted]);

  const handleUseMax = () => {
    if (internalBalance.availableFormatted !== "0") {
      setAmount(internalBalance.availableFormatted);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amount.trim()) {
      toast.error(t("internalPayout.validation.amount"));
      return;
    }

    const destinationValue = destination.trim();
    if (!destinationValue) {
      toast.error(t("internalPayout.validation.destination"));
      return;
    }

    if (!isEthereumAddress(destinationValue)) {
      toast.error(t("internalPayout.validation.destinationInvalid"));
      return;
    }

    if (availableFloat <= 0) {
      toast.error(t("internalPayout.validation.insufficient"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/internal-balance/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount.trim(),
          destinationAddress: destinationValue,
          note: note.trim() || undefined,
          walletAddress: internalBalance.wallet?.walletAddress ?? address,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const errorCode = payload?.error as string | undefined;
        const messageKey =
          errorCode && errorCode in errorTranslations
            ? errorTranslations[errorCode as keyof typeof errorTranslations]
            : "internalPayout.error";
        toast.error(t(messageKey));
        return;
      }

      toast.success(t("internalPayout.success"));
      setAmount("");
      setNote("");
      await Promise.all([internalBalance.refresh(), withdrawRequests.refresh()]);
    } catch (submitError) {
      console.error("[internal-payout] submit error", submitError);
      toast.error(t("internalPayout.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="dark:border-dark-outline dark:bg-dark-surface rounded-3xl border border-outline bg-surface shadow-card">
      <div className="flex flex-col gap-6 rounded-3xl p-8 md:p-10">
        <div className="flex flex-col gap-3">
          <span className="pill dark:bg-dark-surfaceAlt dark:text-dark-foreground bg-surfaceAlt text-foreground">
            {t("internalPayout.badge")}
          </span>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="dark:text-dark-foreground display-title text-3xl font-semibold text-foreground md:text-4xl">
                {t("internalPayout.title")}
              </h2>
              <p className="dark:text-dark-foregroundMuted mt-2 max-w-2xl text-sm text-foregroundMuted md:text-base">
                {t("internalPayout.description")}
              </p>
            </div>
            <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt rounded-2xl border border-outline bg-surfaceAlt p-4 text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("internalPayout.helper")}
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-outline/70 p-5 dark:border-dark-outline/70">
            <span className="text-xs uppercase tracking-[0.25em] text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("wallet.statistics.internal.title")}
            </span>
            <div>
              <p className="text-3xl font-semibold text-foreground dark:text-dark-foreground">
                {internalBalance.availableFormatted} {internalBalance.tokenSymbol}
              </p>
              <p className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
                {t("wallet.statistics.internal.available")}
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-foregroundMuted dark:text-dark-foregroundMuted">
                  {t("wallet.statistics.internal.total")}
                </span>
                <p className="font-semibold text-foreground dark:text-dark-foreground">
                  {internalBalance.totalFormatted} {internalBalance.tokenSymbol}
                </p>
              </div>
              <div>
                <span className="text-foregroundMuted dark:text-dark-foregroundMuted">
                  {t("wallet.statistics.internal.pending")}
                </span>
                <p className="font-semibold text-foreground dark:text-dark-foreground">
                  {internalBalance.pendingFormatted} {internalBalance.tokenSymbol}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleUseMax}
              disabled={internalBalance.availableFormatted === "0"}
            >
              {t("internalPayout.useMax")}
            </Button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-foregroundMuted dark:text-dark-foregroundMuted">
                {t("internalPayout.amountLabel")}
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground rounded-2xl border border-outline bg-surface px-4 py-3 text-sm outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-foregroundMuted dark:text-dark-foregroundMuted">
                {t("internalPayout.addressLabel")}
              </label>
              <input
                className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground rounded-2xl border border-outline bg-surface px-4 py-3 text-sm outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="0x..."
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-foregroundMuted dark:text-dark-foregroundMuted">
                {t("internalPayout.noteLabel")}
              </label>
              <textarea
                className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground rounded-2xl border border-outline bg-surface px-4 py-3 text-sm outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || internalBalance.availableFormatted === "0"}
              className="w-full"
            >
              {isSubmitting ? t("common.buttons.update") : t("internalPayout.submit")}
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-outline/70 bg-surfaceAlt p-5 dark:border-dark-outline/70 dark:bg-dark-surfaceAlt">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground">
              {t("internalPayout.table.title")}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => withdrawRequests.refresh()}>
              {t("common.buttons.refresh")}
            </Button>
          </div>

          {withdrawRequests.isLoading ? (
            <p className="mt-4 text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("wallet.statistics.internal.loading")}
            </p>
          ) : withdrawRequests.requests.length === 0 ? (
            <p className="mt-4 text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("internalPayout.table.empty")}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.2em] text-foregroundMuted dark:text-dark-foregroundMuted">
                    <th className="pb-3 pr-4">{t("internalPayout.table.columns.amount")}</th>
                    <th className="pb-3 pr-4">{t("internalPayout.table.columns.destination")}</th>
                    <th className="pb-3 pr-4">{t("internalPayout.table.columns.status")}</th>
                    <th className="pb-3 pr-4">{t("internalPayout.table.columns.txHash")}</th>
                    <th className="pb-3">{t("internalPayout.table.columns.created")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/50 dark:divide-dark-outline/60">
                  {withdrawRequests.requests.map((request) => (
                    <tr key={request.id}>
                      <td className="py-3 pr-4 font-semibold text-foreground dark:text-dark-foreground">
                        {request.amount} {request.tokenSymbol}
                      </td>
                      <td className="py-3 pr-4 text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
                        {request.destinationAddress}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium",
                            STATUS_COLORS[request.status] ?? "bg-surface text-foreground",
                          )}
                        >
                          {t(`internalPayout.table.status.${request.status}`)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
                        {request.txHash ? (
                          <a
                            href={`https://etherscan.io/tx/${request.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent underline-offset-2 hover:underline"
                          >
                            {request.txHash.slice(0, 8)}…
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
                        {new Date(request.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
