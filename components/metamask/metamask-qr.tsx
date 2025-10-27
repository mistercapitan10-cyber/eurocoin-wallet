"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import Image from "next/image";

export function MetaMaskQR() {
  const t = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
    }, 100);
  }, []);

  if (!isMounted) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-6">
          <div className="dark:bg-dark-surfaceAlt h-96 animate-pulse rounded-lg bg-surfaceAlt" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <Card className="dark:border-dark-outline dark:from-dark-surface dark:to-dark-surfaceAlt overflow-hidden border-2 border-outline bg-gradient-to-br from-surface to-surfaceAlt shadow-card-elevated">
        <CardContent className="p-12">
          <div className="flex flex-col items-center space-y-8 text-center">
            {/* MetaMask Logo */}
            <div className="relative h-32 w-32">
              <Image
                src="/metamask.png"
                alt="MetaMask Logo"
                fill
                sizes="(max-width: 768px) 128px, 128px"
                className="object-contain"
                priority
              />
            </div>

            {/* Title */}
            <div className="space-y-3">
              <h2 className="dark:text-dark-foreground text-4xl font-bold text-foreground">
                {t("metamask.download.title")}
              </h2>
              <p className="dark:text-dark-foregroundMuted text-lg text-foregroundMuted">
                {t("metamask.download.subtitle")}
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="dark:border-dark-outline dark:bg-dark-surface rounded-xl border border-outline bg-surface p-4">
                <div className="mb-2 flex justify-center">
                  <svg
                    className="h-8 w-8 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="dark:text-dark-foreground mb-1 text-sm font-semibold text-foreground">
                  {t("metamask.download.feature1.title")}
                </h3>
                <p className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted">
                  {t("metamask.download.feature1.description")}
                </p>
              </div>

              <div className="dark:border-dark-outline dark:bg-dark-surface rounded-xl border border-outline bg-surface p-4">
                <div className="mb-2 flex justify-center">
                  <svg
                    className="h-8 w-8 text-accent"
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
                </div>
                <h3 className="dark:text-dark-foreground mb-1 text-sm font-semibold text-foreground">
                  {t("metamask.download.feature2.title")}
                </h3>
                <p className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted">
                  {t("metamask.download.feature2.description")}
                </p>
              </div>

              <div className="dark:border-dark-outline dark:bg-dark-surface rounded-xl border border-outline bg-surface p-4">
                <div className="mb-2 flex justify-center">
                  <svg
                    className="h-8 w-8 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                </div>
                <h3 className="dark:text-dark-foreground mb-1 text-sm font-semibold text-foreground">
                  {t("metamask.download.feature3.title")}
                </h3>
                <p className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted">
                  {t("metamask.download.feature3.description")}
                </p>
              </div>
            </div>

            {/* Download Button */}
            <a
              href="https://metamask.io/download"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-accent to-accentAlt px-8 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl group-hover:scale-105 md:w-auto"
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {t("metamask.download.button")}
              </Button>
            </a>

            {/* Info */}
            <p className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted">
              {t("metamask.download.available")}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
