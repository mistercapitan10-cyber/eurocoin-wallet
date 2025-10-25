"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

export function ExchangeSection(): JSX.Element {
  const t = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [tokenAmount, setTokenAmount] = useState("1000");
  const [rubAmount, setRubAmount] = useState("150000");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Calculate RUB amount based on token amount
    const tokens = parseFloat(tokenAmount) || 0;
    const rate = 150; // Fixed rate: 150 RUB per 1 TOKEN
    const commission = 0.015; // 1.5% commission
    const rubs = tokens * rate * (1 - commission);
    setRubAmount(Math.round(rubs).toLocaleString("ru-RU"));
  }, [tokenAmount, isMounted]);

  const handleTokenAmountChange = (value: string) => {
    // Remove non-numeric characters except dots
    const cleanValue = value.replace(/[^\d.]/g, "");
    setTokenAmount(cleanValue);
  };

  const copyTemplate = () => {
    const template = `Заявка на обмен токенов:
Сумма: ${tokenAmount} TOKEN
Получить: ~${rubAmount} RUB
Курс: 150 RUB за 1 TOKEN
Комиссия: 1.5%`;

    navigator.clipboard.writeText(template).then(() => {
      // You could add a toast notification here
      console.log("Template copied to clipboard");
    });
  };

  const copyUsername = () => {
    navigator.clipboard.writeText("@corporate_bot").then(() => {
      console.log("Username copied to clipboard");
    });
  };

  if (!isMounted) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 h-8 w-64 animate-pulse rounded bg-surfaceAlt" />
            <div className="h-4 w-full animate-pulse rounded bg-surfaceAlt" />
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="h-96 animate-pulse rounded-lg bg-surfaceAlt" />
            <div className="h-96 animate-pulse rounded-lg bg-surfaceAlt" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="exchange" className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">TELEGRAM-ОБМЕННИК</h2>
          <p className="text-lg text-foregroundMuted">
            Интерфейс для конвертации корпоративных токенов в фиатные средства с передачей заявки
            через Telegram-бота. Функционал представляется в виде заглушек.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Exchange Calculator */}
          <Card className="shadow-card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground">Калькулятор обмена</CardTitle>
              <CardDescription>
                Введите сумму и получите предварительный расчёт. Значения статичны.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Fields */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    СУММА В ТОКЕНАХ
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tokenAmount}
                      onChange={(e) => handleTokenAmountChange(e.target.value)}
                      className="w-full rounded-lg border border-outline bg-surface px-4 py-3 text-lg font-semibold text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="1 000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foregroundMuted">
                      TOKEN
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    ПОЛУЧИТЕ (RUB)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={`~ ${rubAmount}`}
                      readOnly
                      className="w-full rounded-lg border border-outline bg-surfaceAlt px-4 py-3 text-lg font-semibold text-foreground"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foregroundMuted">
                      RUB
                    </span>
                  </div>
                </div>
              </div>

              {/* Exchange Details */}
              <div className="space-y-3 rounded-lg border border-outline bg-surfaceAlt p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-foregroundMuted">Курс фиксирован на уровне</span>
                  <span className="font-medium text-foreground">150 RUB за 1 TOKEN</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foregroundMuted">Комиссия обмена</span>
                  <span className="font-medium text-foreground">1.5% (из конфигурации)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foregroundMuted">Среднее время обработки</span>
                  <span className="font-medium text-foreground">15 минут</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button className="flex-1 bg-accent text-white hover:bg-accent/90">
                  <svg
                    className="mr-2 h-4 w-4"
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
                  Создать заявку в Telegram
                </Button>
                <Button variant="outline" onClick={copyTemplate}>
                  <svg
                    className="mr-2 h-4 w-4"
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
                  Скопировать шаблон
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Section */}
          <Card className="shadow-card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground">QR-код связи</CardTitle>
              <CardDescription>
                Сканируйте, чтобы открыть чат с корпоративным ботом.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code Placeholder */}
              <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-lg border-2 border-outline bg-white">
                <div className="space-y-2 text-center">
                  <svg
                    className="mx-auto h-16 w-16 text-foregroundMuted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4"
                    />
                  </svg>
                  <p className="text-sm text-foregroundMuted">QR Placeholder</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Скачать QR-код
                </Button>
                <Button variant="outline" onClick={copyUsername}>
                  <svg
                    className="mr-2 h-4 w-4"
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
                  Скопировать @username
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ and Chatbot Sections */}
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">FAQ по обмену</CardTitle>
              <CardDescription>Аккордеон будет интерактивным на следующей фазе.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-outline bg-surfaceAlt p-4">
                  <span className="text-sm font-medium text-foreground">
                    ► Какова минимальная сумма вывода?
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-outline bg-surfaceAlt p-4">
                  <span className="text-sm font-medium text-foreground">
                    ► Сколько времени занимает обработка заявки?
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-outline bg-surfaceAlt p-4">
                  <span className="text-sm font-medium text-foreground">
                    ► Какие документы нужны для обмена?
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chatbot Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Чат-бот</CardTitle>
              <CardDescription>Макет интерфейса общения с ботом.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                    B
                  </div>
                  <div className="flex-1 rounded-lg border border-outline bg-surfaceAlt p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">Bot</span>
                      <span className="text-xs text-foregroundMuted">09:41</span>
                    </div>
                    <p className="text-sm text-foregroundMuted">
                      Здравствуйте! Готов помочь оформить заявку на обмен
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surfaceAlt text-xs font-semibold text-foreground">
                    U
                  </div>
                  <div className="flex-1 rounded-lg border border-outline bg-accent p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-white">You</span>
                      <span className="text-xs text-white/80">09:42</span>
                    </div>
                    <p className="text-sm text-white">Хочу обменять 1000 токенов</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
