"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface FormState {
  requester: string;
  department: string;
  requestType: string;
  description: string;
  priority: "low" | "normal" | "high";
}

const initialState: FormState = {
  requester: "",
  department: "",
  requestType: "",
  description: "",
  priority: "normal",
};

export function InternalRequestForm(): JSX.Element {
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show } = useToast();
  const t = useTranslation();

  const requestTypes = [
    { value: "topUp", label: t("internalForm.requestTypes.topUp") },
    { value: "withdraw", label: t("internalForm.requestTypes.withdraw") },
    { value: "balance", label: t("internalForm.requestTypes.balance") },
    { value: "report", label: t("internalForm.requestTypes.report") },
  ];

  const departments = [
    { value: "finance", label: t("internalForm.departments.finance") },
    { value: "aml", label: t("internalForm.departments.aml") },
    { value: "investment", label: t("internalForm.departments.investment") },
    { value: "support", label: t("internalForm.departments.support") },
  ];

  const handleChange = (
    field: keyof FormState,
    value: string | FormState["priority"],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.requester || !form.department || !form.requestType || !form.description) {
      show({
        title: t("internalForm.validationTitle"),
        description: t("internalForm.validationDescription"),
        variant: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    show({
      title: t("internalForm.successTitle"),
      description: t("internalForm.successDescription"),
      variant: "success",
    });
    setForm(initialState);
  };

  return (
    <section className="rounded-3xl border border-outline bg-surface shadow-card dark:border-dark-outline dark:bg-dark-surface">
      <div className="flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-backgroundAlt/40 to-surface/90 p-8 dark:from-dark-backgroundAlt/40 dark:to-dark-surface/90 md:p-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="pill bg-surfaceAlt text-foreground dark:bg-dark-surfaceAlt dark:text-dark-foreground">{t("internalForm.badge")}</span>
            <h2 className="mt-4 text-3xl font-semibold text-foreground dark:text-dark-foreground md:text-4xl display-title">
              {t("internalForm.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-foregroundMuted dark:text-dark-foregroundMuted md:text-base">
              {t("internalForm.description")}
            </p>
          </div>
          <div className="flex w-full max-w-xs flex-col rounded-2xl border border-outline bg-surfaceAlt p-4 text-xs text-foregroundMuted dark:border-dark-outline dark:bg-dark-surfaceAlt dark:text-dark-foregroundMuted">
            <span className="font-semibold text-foreground dark:text-dark-foreground">{t("internalForm.regulationTitle")}</span>
            <ul className="mt-2 space-y-1">
              <li>{t("internalForm.regulation1")}</li>
              <li>{t("internalForm.regulation2")}</li>
              <li>{t("internalForm.regulation3")}</li>
            </ul>
          </div>
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("internalForm.requester")}
            </label>
            <input
              className="rounded-2xl border border-outline bg-surface px-4 py-3 text-sm text-foreground outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground"
              placeholder={t("internalForm.placeholders.requester")}
              value={form.requester}
              onChange={(event) => handleChange("requester", event.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("internalForm.department")}
            </label>
            <select
              className="rounded-2xl border border-outline bg-surface px-4 py-3 text-sm text-foreground outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground"
              value={form.department}
              onChange={(event) => handleChange("department", event.target.value)}
            >
              <option value="">{t("internalForm.placeholders.department")}</option>
              {departments.map((department) => (
                <option key={department.value} value={department.value}>
                  {department.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("internalForm.requestType")}
            </label>
            <select
              className="rounded-2xl border border-outline bg-surface px-4 py-3 text-sm text-foreground outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground"
              value={form.requestType}
              onChange={(event) => handleChange("requestType", event.target.value)}
            >
              <option value="">{t("internalForm.placeholders.type")}</option>
              {requestTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("internalForm.priority")}
            </label>
            <div className="flex h-full items-center gap-3 rounded-2xl border border-outline bg-surface px-4 py-3 dark:border-dark-outline dark:bg-dark-surface">
              {(["low", "normal", "high"] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => handleChange("priority", priority)}
                  className={cn(
                    "flex-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
                    form.priority === priority
                      ? "bg-accent text-white shadow focus:outline-none"
                      : "bg-surfaceAlt text-foreground hover:bg-accent/10 dark:bg-dark-surfaceAlt dark:text-dark-foreground dark:hover:bg-accent/10",
                  )}
                >
                  {t(`internalForm.priorities.${priority}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("internalForm.descriptionField")}
            </label>
            <textarea
              className="min-h-[140px] resize-y rounded-2xl border border-outline bg-surface px-4 py-3 text-sm text-foreground outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground"
              placeholder={t("internalForm.placeholders.description")}
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-foregroundMuted dark:text-dark-foregroundMuted">{t("internalForm.helper")}</div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setForm(initialState)}
                disabled={isSubmitting}
              >
                {t("internalForm.buttons.clear")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("common.buttons.update") : t("internalForm.buttons.submit")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
