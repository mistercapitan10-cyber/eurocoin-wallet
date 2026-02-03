"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/ui/file-uploader";
import { toast } from "react-toastify";

import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import { convertFilesToBase64 } from "@/lib/utils/file-converter";

export function ExchangeSection() {
  const { address } = useAccount();
  const { authType, userId, email: userEmail } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [tokenAmount, setTokenAmount] = useState("1000");
  const [eurAmount, setEurAmount] = useState("985");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    walletAddress: "",
    email: "",
    comment: "",
  });

  // Auto-fill wallet address for MetaMask users and email for OAuth users
  useEffect(() => {
    if (authType === "wallet" && address) {
      setFormData((prev) => ({ ...prev, walletAddress: address }));
    } else if (authType === "email" && userEmail) {
      setFormData((prev) => ({ ...prev, email: userEmail }));
    }
  }, [authType, address, userEmail]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslation();

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
    }, 100);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const tokens = parseFloat(tokenAmount) || 0;
    const commission = 0.015; // 1.5% commission
    const euros = tokens * (1 - commission); // 1 TOKEN = 1 EUR, with commission
    setTimeout(() => {
      setEurAmount(Math.round(euros).toLocaleString("ru-RU"));
    }, 100);
  }, [tokenAmount, isMounted]);

  const handleTokenAmountChange = (value: string) => {
    // Remove non-numeric characters except dots
    const cleanValue = value.replace(/[^\d.]/g, "");
    setTokenAmount(cleanValue);
  };

  const copyTemplate = () => {
    const template = `Заявка на обмен токенов:
Сумма: ${tokenAmount} TOKEN
Получить: ~${eurAmount} EUR
Курс: 1 EUR за 1 TOKEN
Комиссия: 1.5%
Адрес кошелька: ${formData.walletAddress || "не указан"}
Email: ${formData.email || "не указан"}`;

    navigator.clipboard.writeText(template).then(() => {
      toast.success(t("exchange.buttons.copySuccess"));
    });
  };

  const handleSubmitRequest = async () => {
    // Validate
    if (!formData.walletAddress || !formData.email) {
      toast.error(t("exchange.errors.fillRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert files to base64 if they exist
      const filesData =
        attachedFiles.length > 0 ? await convertFilesToBase64(attachedFiles) : undefined;

      const response = await fetch("/api/submit-exchange-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenAmount,
          fiatAmount: eurAmount,
          walletAddress: formData.walletAddress,
          email: formData.email,
          comment: formData.comment,
          commission: "1.5%",
          rate: "1 EUR за 1 TOKEN",
          userId: userId || undefined, // Include userId for OAuth users
          files: filesData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      toast.success(t("exchange.errors.submitSuccess"));

      // Dispatch event to notify Investigation Progress
      window.dispatchEvent(
        new CustomEvent("new-request-submitted", {
          detail: { requestId: data.requestId, type: "exchange" },
        }),
      );

      // Reset form - keep wallet address for MetaMask users
      setFormData({
        walletAddress: authType === "wallet" && address ? address : "",
        email: "",
        comment: "",
      });
      setAttachedFiles([]);
    } catch (error) {
      console.error("Error submitting exchange request:", error);
      toast.error(t("exchange.errors.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return (
      <section id="exchange" className="py-16">
        <Card className="shadow-card-elevated">
          <CardHeader>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 h-8 w-64 animate-pulse rounded bg-surfaceAlt dark:bg-dark-surfaceAlt" />
              <div className="h-4 w-full animate-pulse rounded bg-surfaceAlt dark:bg-dark-surfaceAlt" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96 animate-pulse rounded-lg bg-surfaceAlt dark:bg-dark-surfaceAlt" />
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section id="exchange" className="py-16">
      <Card className="shadow-card-elevated">
        <CardHeader>
          <div className="mb-8 text-center">
            <h2 className="mb-4 font-display text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-accent to-accentAlt bg-clip-text text-transparent">
                {t("exchange.title").split(" ")[0]}
              </span>{" "}
              <span className="text-foreground dark:text-white">
                {t("exchange.title").split(" ").slice(1).join(" ") || ""}
              </span>
            </h2>
            <CardDescription className="text-lg">{t("exchange.description")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Exchange Calculator */}
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-2xl font-bold text-foreground dark:text-dark-foreground">
                {t("exchange.calculatorTitle")}
              </h3>
              <p className="text-foregroundMuted dark:text-dark-foregroundMuted">
                {t("exchange.calculatorDescription")}
              </p>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground dark:text-dark-foreground">
                  {t("exchange.fields.tokenAmount")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tokenAmount}
                    onChange={(e) => handleTokenAmountChange(e.target.value)}
                    className="w-full rounded-lg border border-outline bg-surface px-4 py-3 text-lg font-semibold text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground"
                    placeholder={t("exchange.placeholders.tokenAmount")}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foregroundMuted dark:text-dark-foregroundMuted">
                    {t("exchange.fields.tokenUnit")}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground dark:text-dark-foreground">
                  {t("exchange.fields.receiveEur")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={`~ ${eurAmount}`}
                    readOnly
                    className="w-full rounded-lg border border-outline bg-surfaceAlt px-4 py-3 text-lg font-semibold text-foreground dark:border-dark-outline dark:bg-dark-surfaceAlt dark:text-dark-foreground"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foregroundMuted dark:text-dark-foregroundMuted">
                    {t("exchange.fields.eurUnit")}
                  </span>
                </div>
              </div>
            </div>

            {/* Exchange Details */}
            <div className="space-y-3 rounded-lg border border-outline bg-surfaceAlt p-4 dark:border-dark-outline dark:bg-dark-surfaceAlt">
              <div className="flex justify-between text-sm">
                <span className="text-foregroundMuted dark:text-dark-foregroundMuted">
                  {t("exchange.details.exchangeRate")}
                </span>
                <span className="font-medium text-foreground dark:text-dark-foreground">
                  1 EUR за 1 TOKEN
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foregroundMuted dark:text-dark-foregroundMuted">
                  {t("exchange.details.processingTime")}
                </span>
                <span className="font-medium text-foreground dark:text-dark-foreground">
                  {t("exchange.details.processingValue")}
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground dark:text-dark-foreground">
                  {t("exchange.fields.walletAddress")}
                </label>
                <input
                  type="text"
                  value={formData.walletAddress}
                  onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                  className="w-full rounded-lg border border-outline bg-surface px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground"
                  placeholder={t("exchange.placeholders.walletAddress")}
                  disabled={authType === "wallet"}
                  required
                />
                {authType === "wallet" && address && (
                  <p className="mt-1 text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
                    {t("exchange.fields.walletAddressAutoFilled")}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground dark:text-dark-foreground">
                  {t("exchange.fields.email")}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-outline bg-surface px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground"
                  placeholder={t("exchange.placeholders.email")}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground dark:text-dark-foreground">
                  {t("exchange.fields.comment")}
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full rounded-lg border border-outline bg-surface px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground"
                  placeholder={t("exchange.placeholders.comment")}
                  rows={3}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground dark:text-dark-foreground">
                  Attach Files (Optional)
                </label>
                <FileUploader
                  onFilesChange={setAttachedFiles}
                  maxFiles={5}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 md:flex-row">
              <Button
                onClick={handleSubmitRequest}
                disabled={isSubmitting}
                className="bg-accent text-white hover:bg-accent/90 md:flex-1"
              >
                <svg
                  className="h-4 w-4 md:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="hidden md:inline">
                  {isSubmitting
                    ? t("exchange.buttons.submitting")
                    : t("exchange.buttons.submitFull")}
                </span>
                <span className="md:hidden">
                  {isSubmitting
                    ? t("exchange.buttons.submitting")
                    : t("exchange.buttons.submitShort")}
                </span>
              </Button>
              <Button variant="outline" onClick={copyTemplate} className="md:w-auto">
                <svg
                  className="h-4 w-4 md:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="hidden md:inline">{t("exchange.buttons.copyFull")}</span>
                <span className="md:hidden">{t("exchange.buttons.copyShort")}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
