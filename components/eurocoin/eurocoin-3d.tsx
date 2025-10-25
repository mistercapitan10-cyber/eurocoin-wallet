"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { ConnectButton } from "@/components/wallet/connect-button";
import { WalletStatus } from "@/components/wallet/wallet-status";

export function EuroCoin3D(): JSX.Element {
  const t = useTranslation();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Main Title */}
          <div className="space-y-3">
            <h2 className="dark:text-dark-foreground text-center text-3xl font-bold text-foreground">
              {t("tokenSection.mainTitle")}
            </h2>
            <div className="flex items-center justify-center gap-4">
              {/* Ethereum Icon */}
              <div className="dark:bg-dark-surfaceAlt flex items-center gap-2 rounded-lg bg-surfaceAlt px-3 py-2">
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
                <span className="dark:text-dark-foreground text-sm font-medium text-foreground">
                  Ethereum
                </span>
              </div>

              {/* MetaMask Icon */}
              <div className="dark:bg-dark-surfaceAlt flex items-center gap-2 rounded-lg bg-surfaceAlt px-3 py-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-accentAlt"
                >
                  <path d="M22.56 2.44L13.8 8.64L15.16 4.4L22.56 2.44Z" fill="#E2761B" />
                  <path d="M1.44 2.44L10.12 8.68L8.84 4.4L1.44 2.44Z" fill="#E4761B" />
                  <path
                    d="M19.32 17.52L16.8 20.88L21.84 22.08L23.2 17.64L19.32 17.52Z"
                    fill="#E4761B"
                  />
                  <path d="M0.8 17.64L2.16 22.08L7.2 20.88L4.68 17.52L0.8 17.64Z" fill="#E4761B" />
                  <path d="M6.8 10.8L5.6 12.8L10.16 13.04L9.92 8.08L6.8 10.8Z" fill="#E4761B" />
                  <path d="M17.2 10.8L14.04 7.96L13.84 13.04L18.4 12.8L17.2 10.8Z" fill="#E4761B" />
                  <path d="M7.2 20.88L10.32 19.44L7.6 17.68L7.2 20.88Z" fill="#E4761B" />
                  <path d="M13.68 19.44L16.8 20.88L16.4 17.68L13.68 19.44Z" fill="#E4761B" />
                  <path
                    d="M16.8 20.88L13.68 19.44L13.92 21.28L13.88 22.08L16.8 20.88Z"
                    fill="#D7C1B3"
                  />
                  <path
                    d="M7.2 20.88L10.12 22.08L10.08 21.28L10.32 19.44L7.2 20.88Z"
                    fill="#D7C1B3"
                  />
                  <path d="M10.4 16.24L7.76 15.2L9.28 14.32L10.4 16.24Z" fill="#233447" />
                  <path d="M13.6 16.24L14.72 14.32L16.24 15.2L13.6 16.24Z" fill="#233447" />
                  <path d="M7.2 20.88L7.68 17.52L4.68 17.68L7.2 20.88Z" fill="#CD6116" />
                  <path d="M16.32 17.52L16.8 20.88L19.32 17.68L16.32 17.52Z" fill="#CD6116" />
                  <path
                    d="M18.4 12.8L13.84 13.04L14.4 16.24L14.72 14.32L16.24 15.2L18.4 12.8Z"
                    fill="#CD6116"
                  />
                  <path
                    d="M7.76 15.2L9.28 14.32L9.6 16.24L10.16 13.04L5.6 12.8L7.76 15.2Z"
                    fill="#CD6116"
                  />
                  <path d="M5.6 12.8L7.6 17.68L7.76 15.2L5.6 12.8Z" fill="#E4761B" />
                  <path d="M16.24 15.2L16.4 17.68L18.4 12.8L16.24 15.2Z" fill="#E4761B" />
                  <path d="M10.16 13.04L9.6 16.24L10.4 16.24L10.16 13.04Z" fill="#E4761B" />
                  <path d="M13.84 13.04L13.6 16.24L14.4 16.24L13.84 13.04Z" fill="#E4761B" />
                  <path
                    d="M13.6 16.24L10.4 16.24L10.8 17.12L10.8 17.68L13.6 16.24Z"
                    fill="#F5841F"
                  />
                  <path d="M14.4 16.24L17.2 17.68L17.2 17.12L14.4 16.24Z" fill="#F5841F" />
                  <path d="M13.84 13.04L13.68 19.44L14.4 16.24L13.84 13.04Z" fill="#F5841F" />
                  <path d="M10.16 13.04L9.6 16.24L10.32 19.44L10.16 13.04Z" fill="#F5841F" />
                  <path d="M10.32 19.44L10.4 16.24L9.6 16.24L10.32 19.44Z" fill="#F5841F" />
                  <path d="M13.68 19.44L13.6 16.24L14.4 16.24L13.68 19.44Z" fill="#F5841F" />
                  <path d="M13.6 16.24L10.4 16.24L10.8 17.12L13.6 16.24Z" fill="#F5841F" />
                  <path d="M14.4 16.24L17.2 17.12L14.4 16.24Z" fill="#F5841F" />
                </svg>
                <span className="dark:text-dark-foreground text-sm font-medium text-foreground">
                  MetaMask
                </span>
              </div>
            </div>

            {/* Intro text */}
            <p className="dark:text-dark-foregroundMuted text-center text-base leading-relaxed text-foregroundMuted">
              {t("tokenSection.recovery.p1")}
            </p>
            <p className="dark:text-dark-foregroundMuted text-center text-base leading-relaxed text-foregroundMuted">
              {t("tokenSection.recovery.p2")}
            </p>
            <p className="dark:text-dark-foregroundMuted text-center text-base leading-relaxed text-foregroundMuted">
              {t("tokenSection.recovery.p3")}
            </p>
          </div>

          {/* Legal Protection Section */}
          <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt space-y-3 rounded-2xl border border-outline bg-surfaceAlt p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-xl">
                ⚖️
              </div>
              <h3 className="dark:text-dark-foreground text-xl font-bold text-foreground">
                {t("tokenSection.legal.title")}
              </h3>
            </div>
            <p className="dark:text-dark-foregroundMuted text-sm leading-relaxed text-foregroundMuted">
              {t("tokenSection.legal.p1")}
            </p>
            <p className="dark:text-dark-foregroundMuted text-sm leading-relaxed text-foregroundMuted">
              {t("tokenSection.legal.p2")}
            </p>
          </div>

          {/* Process Section */}
          <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt space-y-3 rounded-2xl border border-outline bg-surfaceAlt p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500 text-xl">
                🧾
              </div>
              <h3 className="dark:text-dark-foreground text-xl font-bold text-foreground">
                {t("tokenSection.process.title")}
              </h3>
            </div>
            <ol className="dark:text-dark-foregroundMuted space-y-2 text-sm leading-relaxed text-foregroundMuted">
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
          <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt space-y-3 rounded-2xl border border-outline bg-surfaceAlt p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500 text-xl">
                💼
              </div>
              <h3 className="dark:text-dark-foreground text-xl font-bold text-foreground">
                {t("tokenSection.whyChooseUs.title")}
              </h3>
            </div>
            <ul className="dark:text-dark-foregroundMuted space-y-2 text-sm leading-relaxed text-foregroundMuted">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-xl">
                🔍
              </div>
              <h3 className="dark:text-dark-foreground text-xl font-bold text-foreground">
                {t("tokenSection.checkToday.title")}
              </h3>
            </div>
            <p className="dark:text-dark-foregroundMuted text-sm leading-relaxed text-foregroundMuted">
              {t("tokenSection.checkToday.p1")}
            </p>
            <p className="dark:text-dark-foregroundMuted text-sm leading-relaxed text-foregroundMuted">
              {t("tokenSection.checkToday.p2")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
