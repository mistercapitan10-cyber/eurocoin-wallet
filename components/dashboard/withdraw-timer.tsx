"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";

const mockSeconds = 60 * 60 * 6 + 32 * 60 + 17; // 6h 32m 17s

export function WithdrawTimer() {
  const t = useTranslation();
  const progress = useMemo(() => 65, []);
  const segments = useMemo(
    () => [
      { label: t("timer.hours"), value: Math.floor(mockSeconds / 3600) },
      { label: t("timer.minutes"), value: Math.floor((mockSeconds % 3600) / 60) },
      { label: t("timer.seconds"), value: mockSeconds % 60 },
    ],
    [t],
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{t("timer.title")}</CardTitle>
          <CardDescription>{t("timer.description")}</CardDescription>
        </div>
        <span className="rounded-full bg-surfaceAlt px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-foregroundMuted dark:bg-dark-surfaceAlt dark:text-dark-foregroundMuted">
          {t("timer.status")}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {segments.map((segment) => (
            <div
              key={segment.label}
              className="rounded-2xl border border-outline bg-surfaceAlt p-4 text-center shadow-sm dark:border-dark-outline dark:bg-dark-surfaceAlt"
            >
              <span className="block text-3xl font-semibold text-foreground dark:text-dark-foreground">
                {segment.value.toString().padStart(2, "0")}
              </span>
              <span className="mt-2 text-xs uppercase tracking-[0.22em] text-foregroundMuted dark:text-dark-foregroundMuted">
                {segment.label}
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
            <span>{t("timer.progress")}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-outline dark:bg-dark-outline">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-foregroundMuted dark:text-dark-foregroundMuted">{t("timer.meta")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
