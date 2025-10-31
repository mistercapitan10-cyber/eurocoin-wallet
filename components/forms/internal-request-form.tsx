"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/ui/file-uploader";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import { convertFilesToBase64 } from "@/lib/utils/file-converter";

interface FormState {
  requester: string;
  department: string;
  requestType: string;
  description: string;
  priority: "low" | "normal" | "high";
  walletAddress: string; // Add wallet address field
}

const initialState: FormState = {
  requester: "",
  department: "",
  requestType: "",
  description: "",
  priority: "normal",
  walletAddress: "",
};

export function InternalRequestForm() {
  const { address } = useAccount();
  const { authType, userId, email } = useAuth();
  const [form, setForm] = useState<FormState>(initialState);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslation();

  // Auto-fill wallet address for MetaMask users
  useEffect(() => {
    if (authType === "wallet" && address) {
      setForm((prev) => ({ ...prev, walletAddress: address }));
    }
  }, [authType, address]);

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

  const handleChange = (field: keyof FormState, value: string | FormState["priority"]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const triggerConfetti = () => {
    // Create a burst of confetti from the center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"],
    });

    // Add a second burst after a short delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"],
      });
    }, 200);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate required fields
    if (!form.requester || !form.department || !form.requestType || !form.description) {
      toast.error(t("internalForm.validationTitle"));
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert files to base64 if they exist
      const filesData = attachedFiles.length > 0
        ? await convertFilesToBase64(attachedFiles)
        : undefined;

      // Send request to API with wallet address, userId, and email
      const response = await fetch("/api/submit-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          walletAddress: form.walletAddress, // Use form field instead of address directly
          userId: userId || undefined, // Include userId for OAuth users
          email: email || undefined, // Include email for OAuth users
          files: filesData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      // Trigger confetti effect
      triggerConfetti();

      // Dispatch event to update investigation progress
      window.dispatchEvent(new CustomEvent("new-request-submitted", { detail: data }));

      toast.success(t("internalForm.successTitle"));
      setForm(initialState);
      setAttachedFiles([]);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error instanceof Error ? error.message : t("internalForm.validationDescription"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="dark:border-dark-outline dark:bg-dark-surface rounded-3xl border border-outline bg-surface shadow-card">
      <div className="dark:from-dark-backgroundAlt/40 dark:to-dark-surface/90 flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-backgroundAlt/40 to-surface/90 p-8 md:p-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="pill dark:bg-dark-surfaceAlt dark:text-dark-foreground bg-surfaceAlt text-foreground">
              {t("internalForm.badge")}
            </span>
            <h2 className="dark:text-dark-foreground display-title mt-4 text-3xl font-semibold text-foreground md:text-4xl">
              {t("internalForm.title")}
            </h2>
            <p className="dark:text-dark-foregroundMuted mt-2 max-w-2xl text-sm text-foregroundMuted md:text-base">
              {t("internalForm.description")}
            </p>
          </div>
          <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt dark:text-dark-foregroundMuted flex w-full max-w-xs flex-col rounded-2xl border border-outline bg-surfaceAlt p-4 text-xs text-foregroundMuted">
            <span className="dark:text-dark-foreground font-semibold text-foreground">
              {t("internalForm.regulationTitle")}
            </span>
            <ul className="mt-2 space-y-1">
              <li>{t("internalForm.regulation1")}</li>
              <li>{t("internalForm.regulation2")}</li>
              <li>{t("internalForm.regulation3")}</li>
            </ul>
          </div>
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="dark:text-dark-foregroundMuted text-xs font-semibold uppercase tracking-[0.24em] text-foregroundMuted">
              {t("internalForm.requester")}
            </label>
            <input
              className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground rounded-2xl border border-outline bg-surface px-4 py-3 text-sm text-foreground outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder={t("internalForm.placeholders.requester")}
              value={form.requester}
              onChange={(event) => handleChange("requester", event.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="dark:text-dark-foregroundMuted text-xs font-semibold uppercase tracking-[0.24em] text-foregroundMuted">
              {t("internalForm.department")}
            </label>
            <select
              className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground rounded-2xl border border-outline bg-surface px-4 py-3 text-sm text-foreground outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20"
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
            <label className="dark:text-dark-foregroundMuted text-xs font-semibold uppercase tracking-[0.24em] text-foregroundMuted">
              {t("internalForm.requestType")}
            </label>
            <select
              className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground rounded-2xl border border-outline bg-surface px-4 py-3 text-sm text-foreground outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20"
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
            <label className="dark:text-dark-foregroundMuted text-xs font-semibold uppercase tracking-[0.24em] text-foregroundMuted">
              {t("internalForm.priority")}
            </label>
            <div className="dark:border-dark-outline dark:bg-dark-surface flex h-full items-center gap-3 rounded-2xl border border-outline bg-surface px-4 py-3">
              {(["low", "normal", "high"] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => handleChange("priority", priority)}
                  className={cn(
                    "flex-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
                    form.priority === priority
                      ? "bg-accent text-white shadow focus:outline-none"
                      : "dark:bg-dark-surfaceAlt dark:text-dark-foreground bg-surfaceAlt text-foreground hover:bg-accent/10 dark:hover:bg-accent/10",
                  )}
                >
                  {t(`internalForm.priorities.${priority}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="dark:text-dark-foregroundMuted text-xs font-semibold uppercase tracking-[0.24em] text-foregroundMuted">
              {t("internalForm.descriptionField")}
            </label>
            <textarea
              className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground min-h-[140px] resize-y rounded-2xl border border-outline bg-surface px-4 py-3 text-sm text-foreground outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder={t("internalForm.placeholders.description")}
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="dark:text-dark-foregroundMuted text-xs font-semibold uppercase tracking-[0.24em] text-foregroundMuted">
              {t("internalForm.walletAddress")}
            </label>
            <input
              className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground rounded-2xl border border-outline bg-surface px-4 py-3 text-sm text-foreground outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder={t("internalForm.placeholders.walletAddress")}
              value={form.walletAddress}
              onChange={(event) => handleChange("walletAddress", event.target.value)}
              disabled={authType === "wallet"}
              autoComplete="off"
            />
            {authType === "wallet" && address && (
              <p className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted">
                {t("internalForm.walletAddressAutoFilled")}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="dark:text-dark-foregroundMuted text-xs font-semibold uppercase tracking-[0.24em] text-foregroundMuted">
              Attach Files (Optional)
            </label>
            <FileUploader
              onFilesChange={setAttachedFiles}
              maxFiles={5}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between">
            <div className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted">
              {t("internalForm.helper")}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setForm(initialState)}
                disabled={isSubmitting}
              >
                {t("internalForm.buttons.clear")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="relative overflow-hidden transition-all duration-300 after:absolute after:inset-0 after:z-[-1] after:rounded-full after:bg-accent/20 after:transition after:duration-500 after:content-[''] hover:scale-105 hover:shadow-lg hover:after:scale-150 hover:after:opacity-0 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {isSubmitting ? t("common.buttons.update") : t("internalForm.buttons.submit")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
