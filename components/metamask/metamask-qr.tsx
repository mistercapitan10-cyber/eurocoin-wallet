"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

export function MetaMaskQR(): JSX.Element {
  const t = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr,1fr] lg:items-center">
            <div className="space-y-6">
              <div className="h-8 w-48 animate-pulse rounded bg-surfaceAlt" />
              <div className="h-4 w-full animate-pulse rounded bg-surfaceAlt" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-surfaceAlt" />
            </div>
            <div className="h-64 animate-pulse rounded-lg bg-surfaceAlt" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr,1fr] lg:items-center">
          {/* Left side - Description */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground">Подключение через QR-код</h2>
              </div>
              <p className="text-foregroundMuted">
                Быстрое подключение к MetaMask без установки расширения. Отсканируйте QR-код
                мобильным приложением MetaMask для мгновенного доступа к системе управления
                токенами.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-outline bg-surfaceAlt p-4">
                <h4 className="mb-2 font-semibold text-foreground">Как подключиться:</h4>
                <ol className="space-y-2 text-sm text-foregroundMuted">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                      1
                    </span>
                    <span>Установите приложение MetaMask на мобильное устройство</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                      2
                    </span>
                    <span>Откройте приложение и выберите "Подключиться через QR-код"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                      3
                    </span>
                    <span>Отсканируйте QR-код справа для автоматического подключения</span>
                  </li>
                </ol>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button className="bg-accent text-white hover:bg-accent/90">
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
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  Скачать MetaMask
                </Button>
                <Button variant="outline">
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
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                    />
                  </svg>
                  Поделиться
                </Button>
              </div>
            </div>
          </div>

          {/* Right side - QR Code */}
          <div className="flex justify-center">
            <Card className="overflow-hidden shadow-card-elevated">
              <CardHeader className="bg-gradient-to-r from-accent to-accentAlt text-white">
                <CardTitle className="text-center">MetaMask Connect</CardTitle>
                <CardDescription className="text-center text-white/80">
                  Отсканируйте для подключения
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
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
                      <p className="text-sm text-foregroundMuted">QR-код для подключения</p>
                      <p className="text-xs text-foregroundMuted">MetaMask Mobile</p>
                    </div>
                  </div>

                  {/* Connection Info */}
                  <div className="space-y-3 text-center">
                    <div className="rounded-lg bg-surfaceAlt p-3">
                      <p className="text-sm font-medium text-foreground">Сеть: Ethereum Mainnet</p>
                      <p className="text-xs text-foregroundMuted">Chain ID: 1</p>
                    </div>
                    <div className="rounded-lg bg-surfaceAlt p-3">
                      <p className="text-sm font-medium text-foreground">
                        Статус: Готов к подключению
                      </p>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-green-600">Активно</span>
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                    <div className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <div>
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                          Безопасность
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Подключайтесь только к проверенным сетям. Проверьте адрес перед
                          подтверждением.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
