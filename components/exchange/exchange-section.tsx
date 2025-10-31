"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/ui/file-uploader";
import toast from "react-hot-toast";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import { useTokenPrice } from "@/hooks/use-token-price";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import { convertFilesToBase64 } from "@/lib/utils/file-converter";

export function ExchangeSection() {
  const { address } = useAccount();
  const { authType, userId, email: userEmail } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [tokenAmount, setTokenAmount] = useState("1000");
  const [eurAmount, setEurAmount] = useState("920");
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
  const { USD_EUR, loading: rateLoading } = useExchangeRate();
  const { priceUsd, isLoading: isPriceLoading } = useTokenPrice({ refetchInterval: 60_000 });
  const t = useTranslation();

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
    }, 100);
  }, []);

  useEffect(() => {
    if (!isMounted || rateLoading || isPriceLoading || priceUsd === null) return;

    // Calculate EUR amount based on token amount and real EURC price
    // Use dynamic EURC price from CoinGecko
    const tokens = parseFloat(tokenAmount) || 0;
    const tokenPriceUsd = priceUsd; // Real EURC price in USD
    const rate = USD_EUR; // Real USD/EUR rate
    const commission = 0.015; // 1.5% commission
    // Calculate: tokens * EURC_price_in_USD * USD_to_EUR_rate * (1 - commission)
    const euros = tokens * tokenPriceUsd * rate * (1 - commission);
    setTimeout(() => {
      setEurAmount(Math.round(euros).toLocaleString("ru-RU"));
    }, 100);
  }, [tokenAmount, isMounted, USD_EUR, rateLoading, priceUsd, isPriceLoading]);

  const handleTokenAmountChange = (value: string) => {
    // Remove non-numeric characters except dots
    const cleanValue = value.replace(/[^\d.]/g, "");
    setTokenAmount(cleanValue);
  };

  const copyTemplate = () => {
    const tokenPriceUsd = priceUsd || 1; // Fallback to 1 if price not loaded yet
    const template = `Заявка на обмен токенов:
Сумма: ${tokenAmount} TOKEN
Получить: ~${eurAmount} EUR
Курс: ${(tokenPriceUsd * USD_EUR).toFixed(2)} EUR за 1 TOKEN (1 TOKEN = ${tokenPriceUsd.toFixed(2)} USD)
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
    const tokenPriceUsd = priceUsd || 1; // Fallback to 1 if price not loaded yet

    try {
      // Convert files to base64 if they exist
      const filesData = attachedFiles.length > 0
        ? await convertFilesToBase64(attachedFiles)
        : undefined;

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
          rate: `${(tokenPriceUsd * USD_EUR).toFixed(2)} EUR за 1 TOKEN (1 TOKEN = ${tokenPriceUsd.toFixed(2)} USD)`,
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
        })
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
              <div className="dark:bg-dark-surfaceAlt mx-auto mb-4 h-8 w-64 animate-pulse rounded bg-surfaceAlt" />
              <div className="dark:bg-dark-surfaceAlt h-4 w-full animate-pulse rounded bg-surfaceAlt" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="dark:bg-dark-surfaceAlt h-96 animate-pulse rounded-lg bg-surfaceAlt" />
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
              <h3 className="dark:text-dark-foreground mb-2 text-2xl font-bold text-foreground">
                {t("exchange.calculatorTitle")}
              </h3>
              <p className="dark:text-dark-foregroundMuted text-foregroundMuted">
                {t("exchange.calculatorDescription")}
              </p>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div>
                <label className="dark:text-dark-foreground mb-2 block text-sm font-medium text-foreground">
                  {t("exchange.fields.tokenAmount")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tokenAmount}
                    onChange={(e) => handleTokenAmountChange(e.target.value)}
                    className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground w-full rounded-lg border border-outline bg-surface px-4 py-3 text-lg font-semibold text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder={t("exchange.placeholders.tokenAmount")}
                  />
                  <span className="dark:text-dark-foregroundMuted absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foregroundMuted">
                    {t("exchange.fields.tokenUnit")}
                  </span>
                </div>
              </div>

              <div>
                <label className="dark:text-dark-foreground mb-2 block text-sm font-medium text-foreground">
                  {t("exchange.fields.receiveEur")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={`~ ${eurAmount}`}
                    readOnly
                    className="dark:border-dark-outline dark:bg-dark-surfaceAlt dark:text-dark-foreground w-full rounded-lg border border-outline bg-surfaceAlt px-4 py-3 text-lg font-semibold text-foreground"
                  />
                  <span className="dark:text-dark-foregroundMuted absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foregroundMuted">
                    {t("exchange.fields.eurUnit")}
                  </span>
                </div>
              </div>
            </div>

            {/* Exchange Details */}
            <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt space-y-3 rounded-lg border border-outline bg-surfaceAlt p-4">
              <div className="flex justify-between text-sm">
                <span className="dark:text-dark-foregroundMuted text-foregroundMuted">
                  {t("exchange.details.exchangeRate")}
                </span>
                <span className="dark:text-dark-foreground font-medium text-foreground">
                  {rateLoading || isPriceLoading || priceUsd === null
                    ? t("exchange.details.rateLoading")
                    : `${((priceUsd || 1) * USD_EUR).toFixed(2)} ${t("exchange.details.rateFormat")}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="dark:text-dark-foregroundMuted text-foregroundMuted">
                  {t("exchange.details.equivalent")}
                </span>
                <span className="dark:text-dark-foreground font-medium text-foreground">
                  {isPriceLoading || priceUsd === null
                    ? "Loading..."
                    : `1 TOKEN = $${(priceUsd || 1).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="dark:text-dark-foregroundMuted text-foregroundMuted">
                  {t("exchange.details.processingTime")}
                </span>
                <span className="dark:text-dark-foreground font-medium text-foreground">
                  {t("exchange.details.processingValue")}
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="dark:text-dark-foreground mb-2 block text-sm font-medium text-foreground">
                  {t("exchange.fields.walletAddress")}
                </label>
                <input
                  type="text"
                  value={formData.walletAddress}
                  onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                  className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground w-full rounded-lg border border-outline bg-surface px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder={t("exchange.placeholders.walletAddress")}
                  disabled={authType === "wallet"}
                  required
                />
                {authType === "wallet" && address && (
                  <p className="dark:text-dark-foregroundMuted mt-1 text-xs text-foregroundMuted">
                    {t("exchange.fields.walletAddressAutoFilled")}
                  </p>
                )}
              </div>

              <div>
                <label className="dark:text-dark-foreground mb-2 block text-sm font-medium text-foreground">
                  {t("exchange.fields.email")}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground w-full rounded-lg border border-outline bg-surface px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder={t("exchange.placeholders.email")}
                  required
                />
              </div>

              <div>
                <label className="dark:text-dark-foreground mb-2 block text-sm font-medium text-foreground">
                  {t("exchange.fields.comment")}
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground w-full rounded-lg border border-outline bg-surface px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder={t("exchange.placeholders.comment")}
                  rows={3}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="dark:text-dark-foreground mb-2 block text-sm font-medium text-foreground">
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
