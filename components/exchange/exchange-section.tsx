"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ExchangeSection(): JSX.Element {
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
      console.log("Template copied to clipboard");
    });
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
            <CardTitle className="mb-4 text-3xl text-foreground dark:text-dark-foreground">TELEGRAM-ОБМЕННИК</CardTitle>
            <CardDescription className="text-lg">
              Интерфейс для конвертации корпоративных токенов в фиатные средства с передачей заявки
              через Telegram-бота.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Exchange Calculator */}
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-2xl font-bold text-foreground dark:text-dark-foreground">Калькулятор обмена</h3>
              <p className="text-foregroundMuted dark:text-dark-foregroundMuted">
                Введите сумму и получите предварительный расчёт. Значения статичны.
              </p>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground dark:text-dark-foreground">
                  СУММА В ТОКЕНАХ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tokenAmount}
                    onChange={(e) => handleTokenAmountChange(e.target.value)}
                    className="w-full rounded-lg border border-outline bg-surface px-4 py-3 text-lg font-semibold text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground"
                    placeholder="1 000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foregroundMuted dark:text-dark-foregroundMuted">
                    TOKEN
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground dark:text-dark-foreground">
                  ПОЛУЧИТЕ (RUB)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={`~ ${rubAmount}`}
                    readOnly
                    className="w-full rounded-lg border border-outline bg-surfaceAlt px-4 py-3 text-lg font-semibold text-foreground dark:border-dark-outline dark:bg-dark-surfaceAlt dark:text-dark-foreground"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foregroundMuted dark:text-dark-foregroundMuted">
                    RUB
                  </span>
                </div>
              </div>
            </div>

            {/* Exchange Details */}
            <div className="space-y-3 rounded-lg border border-outline bg-surfaceAlt p-4 dark:border-dark-outline dark:bg-dark-surfaceAlt">
              <div className="flex justify-between text-sm">
                <span className="text-foregroundMuted dark:text-dark-foregroundMuted">Курс фиксирован на уровне</span>
                <span className="font-medium text-foreground dark:text-dark-foreground">150 RUB за 1 TOKEN</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foregroundMuted dark:text-dark-foregroundMuted">Комиссия обмена</span>
                <span className="font-medium text-foreground dark:text-dark-foreground">1.5% (из конфигурации)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foregroundMuted dark:text-dark-foregroundMuted">Среднее время обработки</span>
                <span className="font-medium text-foreground dark:text-dark-foreground">15 минут</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button className="flex-1 bg-accent text-white hover:bg-accent/90">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
