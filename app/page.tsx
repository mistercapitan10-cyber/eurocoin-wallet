"use client";
import { useEffect } from "react";
import { ethers } from "ethers";
import { InternalRequestForm } from "@/components/forms/internal-request-form";
import { BalanceCard, PriceTicker, TaxCard, WalletStatistics, DexscreenerChart } from "@/components/wallet";
import { ConnectButton } from "@/components/wallet/connect-button";
import { WalletStatus } from "@/components/wallet/wallet-status";
import { InvestigationProgress } from "@/components/dashboard/investigation-progress";
import { ExchangeSection } from "@/components/exchange";
import { FAQSection } from "@/components/faq";
import { useTranslation } from "@/hooks/use-translation";

export default function Home() {
  const t = useTranslation();

  useEffect(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;

    if (!rpcUrl || !tokenAddress) {
      console.warn(
        "Missing NEXT_PUBLIC_RPC_URL or NEXT_PUBLIC_TOKEN_ADDRESS, skipping token metadata check.",
      );
      return;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const token = new ethers.Contract(
      tokenAddress,
      ["function name() view returns (string)", "function symbol() view returns (string)"],
      provider,
    );

    void (async () => {
      try {
        const [name, symbol] = await Promise.all([token.name(), token.symbol()]);
        console.log("Connected token metadata:", { name, symbol });
      } catch (error) {
        console.error("Failed to fetch token metadata", error);
      }
    })();
  }, []);

  return (
    <main className="dark:from-dark-background dark:to-dark-backgroundAlt min-h-screen bg-gradient-to-br from-background to-backgroundAlt">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 md:px-10">
        {/* Exchange Section */}
        <ExchangeSection />

        {/* Internal Request Form Section */}
        <section id="contact">
          <InternalRequestForm />
        </section>

        {/* Main Header Section */}
        <header
          id="wallet"
          className="dark:border-dark-outline dark:bg-dark-surface rounded-3xl border border-outline bg-surface p-8 shadow-card"
        >
          <div className="space-y-5">
            <span className="pill dark:bg-dark-surfaceAlt dark:text-dark-foreground inline-flex bg-surfaceAlt text-foreground">
              {t("home.hero.badge")}
            </span>
            <h1 className="display-title text-4xl text-accent md:text-5xl">
              {t("home.hero.title")}
            </h1>
            <p className="dark:text-dark-foregroundMuted text-base text-foregroundMuted md:text-lg">
              {t("home.hero.description")}
            </p>
            <div className="dark:text-dark-foregroundMuted flex flex-wrap gap-3 text-xs text-foregroundMuted">
              <span className="dark:bg-dark-backgroundAlt rounded-full bg-backgroundAlt px-3 py-1">
                {t("home.hero.chip1")}
              </span>
              <span className="dark:bg-dark-backgroundAlt rounded-full bg-backgroundAlt px-3 py-1">
                {t("home.hero.chip2")}
              </span>
              <span className="dark:bg-dark-backgroundAlt rounded-full bg-backgroundAlt px-3 py-1">
                {t("home.hero.chip3")}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="dark:border-dark-outline mt-10 border-t border-outline" />

          {/* Wallet Statistics Section */}
          <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt mt-10 rounded-3xl border border-outline bg-surfaceAlt p-8 shadow-card">
            <WalletStatistics />
          </div>

          {/* Wallet Connection Section */}
          <div className="dark:border-dark-outline dark:bg-dark-surfaceAlt mt-10 rounded-3xl border border-outline bg-surfaceAlt p-8 shadow-card">
            <div className="space-y-4">
              <h3 className="dark:text-dark-foreground text-xl font-bold text-foreground">
                {t("tokenSection.walletConnection.title")}
              </h3>
              <p className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted">
                {t("tokenSection.walletConnection.description")}
              </p>
              <div className="space-y-3">
                <ConnectButton />
                <WalletStatus />
              </div>
            </div>
          </div>
        </header>

        {/* Investigation Progress Section */}
        <section id="investigation">
          <InvestigationProgress />
        </section>

        <section
          id="token-balance"
          className="grid gap-6 md:grid-cols-[minmax(0,2fr),minmax(0,1fr)]"
        >
          <div className="flex flex-col gap-6">
            <BalanceCard />
            <PriceTicker />
            <DexscreenerChart />
          </div>
          <TaxCard />
        </section>
      </div>

      {/* FAQ Section */}
      <FAQSection />
    </main>
  );
}
