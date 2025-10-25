"use client";
import { InternalRequestForm } from "@/components/forms/internal-request-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BalanceCard,
  ConnectButton,
  DisconnectButton,
  NetworkSwitcher,
  PriceTicker,
  TaxCard,
  UnsupportedNetworkAlert,
  WalletAddress,
  WalletStatus,
} from "@/components/wallet";
import { WithdrawTimer } from "@/components/dashboard/withdraw-timer";
import { EuroCoin3D } from "@/components/eurocoin";
import { ExchangeSection } from "@/components/exchange";
import { FAQSection } from "@/components/faq";
import { MetaMaskQR } from "@/components/metamask";
import { ReviewsCarousel } from "@/components/reviews";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { useTranslation } from "@/hooks/use-translation";

export default function Home(): JSX.Element {
  const t = useTranslation();

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-backgroundAlt">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 md:px-10">
        {/* EuroCoin 3D Presentation Section - Top */}
        <section>
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-3xl font-bold text-foreground">
              {t("eurocoin.sectionTitle")}
            </h2>
            <p className="text-foregroundMuted">{t("eurocoin.sectionDescription")}</p>
          </div>
          <EuroCoin3D />
        </section>

        {/* MetaMask QR Code Section */}
        <MetaMaskQR />

        {/* Exchange Section */}
        <ExchangeSection />

        <InternalRequestForm />

        <header className="grid gap-10 rounded-3xl border border-outline bg-surface p-8 shadow-card md:grid-cols-[1.7fr,1fr] md:items-center">
          <div className="space-y-5">
            <span className="pill inline-flex bg-surfaceAlt text-foreground">
              {t("home.hero.badge")}
            </span>
            <h1 className="display-title text-4xl text-accent md:text-5xl">
              {t("home.hero.title")}
            </h1>
            <p className="text-base text-foregroundMuted md:text-lg">
              {t("home.hero.description")}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-foregroundMuted">
              <span className="rounded-full bg-backgroundAlt px-3 py-1">
                {t("home.hero.chip1")}
              </span>
              <span className="rounded-full bg-backgroundAlt px-3 py-1">
                {t("home.hero.chip2")}
              </span>
              <span className="rounded-full bg-backgroundAlt px-3 py-1">
                {t("home.hero.chip3")}
              </span>
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-outline bg-surfaceAlt p-6 text-sm text-foregroundMuted">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {t("home.hero.statusTitle")}
              </h3>
              <p className="mt-2">{t("home.hero.statusLine1")}</p>
              <p className="mt-1">{t("home.hero.statusLine2")}</p>
              <p className="mt-1">{t("home.hero.statusLine3")}</p>
            </div>
            <div className="rounded-2xl border border-outline bg-surface p-4 text-xs">
              <p className="font-semibold text-foreground">{t("home.hero.checklistTitle")}</p>
              <ul className="mt-2 space-y-1">
                <li>{t("home.hero.checklist1")}</li>
                <li>{t("home.hero.checklist2")}</li>
                <li>{t("home.hero.checklist3")}</li>
              </ul>
            </div>
          </div>
        </header>

        {/* Reviews Carousel Section */}
        <ReviewsCarousel />

        <WithdrawTimer />

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-3">
                <CardTitle className="text-2xl text-foreground">
                  {t("home.walletSection.title")}
                </CardTitle>
                <CardDescription>{t("home.walletSection.description")}</CardDescription>
              </div>
              <span className="pill bg-surfaceAlt text-foreground">
                {t("home.walletSection.phase")}
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <ConnectButton />
              <WalletStatus />
              <WalletAddress />
              <UnsupportedNetworkAlert />
              <NetworkSwitcher />
              <div className="flex justify-end">
                <DisconnectButton />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">{t("home.status.title")}</CardTitle>
              <CardDescription>{t("home.status.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-foregroundMuted">
              <div className="rounded-2xl border border-outline bg-surfaceAlt p-4">
                <p className="font-semibold text-foreground">{t("home.status.phase1Title")}</p>
                <ul className="mt-2 space-y-1">
                  <li>{t("home.status.phase1List1")}</li>
                  <li>{t("home.status.phase1List2")}</li>
                  <li>{t("home.status.phase1List3")}</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-outline bg-surfaceAlt p-4">
                <p className="font-semibold text-accent">{t("home.status.phase2Title")}</p>
                <ul className="mt-2 space-y-1">
                  <li>{t("home.status.phase2List1")}</li>
                  <li>{t("home.status.phase2List2")}</li>
                  <li>{t("home.status.phase2List3")}</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-outline bg-surfaceAlt p-4">
                <p className="font-semibold text-sky-600">{t("home.status.phase3Title")}</p>
                <ul className="mt-2 space-y-1">
                  <li>{t("home.status.phase3List1")}</li>
                  <li>{t("home.status.phase3List2")}</li>
                  <li>{t("home.status.phase3List3")}</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-outline bg-surfaceAlt p-4">
                <p className="font-semibold text-amber-600">{t("home.status.phase4Title")}</p>
                <ul className="mt-2 space-y-1">
                  <li>{t("home.status.phase4List1")}</li>
                  <li>{t("home.status.phase4List2")}</li>
                  <li>{t("home.status.phase4List3")}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <BalanceCard />
            <PriceTicker />
          </div>
          <TaxCard />
        </section>
      </div>

      {/* FAQ Section */}
      <FAQSection />

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </main>
  );
}
