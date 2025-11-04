"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import Image from "next/image";

export function EuroCoin3D() {
  const t = useTranslation();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Main Title */}
          <div className="space-y-3">
            <h2 className="text-center text-3xl font-bold text-foreground dark:text-dark-foreground">
              {t("tokenSection.mainTitle")}
            </h2>
            <div className="flex items-center justify-center gap-4">
              {/* Ethereum Icon */}
              <div className="flex items-center gap-2 rounded-lg bg-surfaceAlt px-3 py-2 dark:bg-dark-surfaceAlt">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-accent"
                >
                  <path
                    d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
                    fill="currentColor"
                  />
                  <path d="M12.498 3V9.87L18.995 12.22L12.498 3Z" fill="white" />
                  <path d="M12.498 3L6 12.22L12.498 9.87V3Z" fill="white" />
                  <path d="M12.498 16.968V20.995L19 13.616L12.498 16.968Z" fill="white" />
                  <path d="M12.498 20.995V16.967L6 13.616L12.498 20.995Z" fill="white" />
                  <path d="M12.498 15.429L18.995 12.22L12.498 9.87V15.429Z" fill="white" />
                  <path d="M6 12.22L12.498 15.429V9.87L6 12.22Z" fill="white" />
                </svg>
                <span className="text-sm font-medium text-foreground dark:text-dark-foreground">
                  Ethereum
                </span>
              </div>

              {/* MetaMask Icon */}
              <div className="flex items-center gap-2 rounded-lg bg-surfaceAlt px-3 py-2 dark:bg-dark-surfaceAlt">
                <Image
                  src="/metamask.png"
                  alt="MetaMask"
                  width={20}
                  height={20}
                  className="object-contain"
                />
                <span className="text-sm font-medium text-foreground dark:text-dark-foreground">
                  MetaMask
                </span>
              </div>
            </div>

            {/* Intro text */}
            <p className="text-center text-base leading-relaxed text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("tokenSection.recovery.p1")}
            </p>
            <p className="text-center text-base leading-relaxed text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("tokenSection.recovery.p2")}
            </p>
            <p className="text-center text-base leading-relaxed text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("tokenSection.recovery.p3")}
            </p>
          </div>

          {/* Legal Protection Section */}
          <div className="space-y-3 rounded-2xl border border-outline bg-surfaceAlt p-5 dark:border-dark-outline dark:bg-dark-surfaceAlt">
            <div className="flex items-center gap-3">
              <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-xl sm:flex">
                ⚖️
              </div>
              <h3 className="text-xl font-bold text-foreground dark:text-dark-foreground">
                {t("tokenSection.legal.title")}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("tokenSection.legal.p1")}
            </p>
            <p className="text-sm leading-relaxed text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("tokenSection.legal.p2")}
            </p>
          </div>

          {/* Process Section */}
          <div className="space-y-3 rounded-2xl border border-outline bg-surfaceAlt p-5 dark:border-dark-outline dark:bg-dark-surfaceAlt">
            <div className="flex items-center gap-3">
              <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-green-500 text-xl sm:flex">
                🧾
              </div>
              <h3 className="text-xl font-bold text-foreground dark:text-dark-foreground">
                {t("tokenSection.process.title")}
              </h3>
            </div>
            <ol className="space-y-2 text-sm leading-relaxed text-foregroundMuted dark:text-dark-foregroundMuted">
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-semibold text-accent">1.</span>
                <span>{t("tokenSection.process.step1")}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-semibold text-accent">2.</span>
                <span>{t("tokenSection.process.step2")}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-semibold text-accent">3.</span>
                <span>{t("tokenSection.process.step3")}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-semibold text-accent">4.</span>
                <span>{t("tokenSection.process.step4")}</span>
              </li>
            </ol>
          </div>

          {/* Why Choose Us Section */}
          <div className="space-y-3 rounded-2xl border border-outline bg-surfaceAlt p-5 dark:border-dark-outline dark:bg-dark-surfaceAlt">
            <div className="flex items-center gap-3">
              <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-purple-500 text-xl sm:flex">
                💼
              </div>
              <h3 className="text-xl font-bold text-foreground dark:text-dark-foreground">
                {t("tokenSection.whyChooseUs.title")}
              </h3>
            </div>
            <ul className="space-y-2 text-sm leading-relaxed text-foregroundMuted dark:text-dark-foregroundMuted">
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-accent">•</span>
                <span>{t("tokenSection.whyChooseUs.item1")}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-accent">•</span>
                <span>{t("tokenSection.whyChooseUs.item2")}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-accent">•</span>
                <span>{t("tokenSection.whyChooseUs.item3")}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-accent">•</span>
                <span>{t("tokenSection.whyChooseUs.item4")}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-accent">•</span>
                <span>{t("tokenSection.whyChooseUs.item5")}</span>
              </li>
            </ul>
          </div>

          {/* Check Today Section */}
          <div className="dark:border-dark-accent/20 dark:from-dark-accent/5 dark:to-dark-accentAlt/5 space-y-3 rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/5 to-accentAlt/5 p-5">
            <div className="flex items-center gap-3">
              <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-xl sm:flex">
                🔍
              </div>
              <h3 className="text-xl font-bold text-foreground dark:text-dark-foreground">
                {t("tokenSection.checkToday.title")}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("tokenSection.checkToday.p1")}
            </p>
            <p className="text-sm leading-relaxed text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("tokenSection.checkToday.p2")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
