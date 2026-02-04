"use client";
import { useEffect } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { InternalRequestForm } from "@/components/forms/internal-request-form";
import { InternalPayoutForm } from "@/components/forms/internal-payout-form";
import { BalanceCard, WalletStatistics } from "@/components/wallet";
import { ConnectButton } from "@/components/wallet/connect-button";
import { WalletStatus } from "@/components/wallet/wallet-status";
import { InvestigationProgress } from "@/components/dashboard/investigation-progress";
import { AllInvestigations } from "@/components/dashboard/all-investigations";
import { ExchangeSection } from "@/components/exchange";
import { FAQSection } from "@/components/faq";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import { PageTitle } from "@/components/layout/page-title";

export default function Home() {
  const t = useTranslation();
  const { address } = useAccount();
  const { email } = useAuth();

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
    <>
      <PageTitle title="Dashboard" description="Token management dashboard" enableSectionTracking />
      <main className="min-h-screen bg-gradient-to-br from-background to-backgroundAlt dark:from-dark-background dark:to-dark-backgroundAlt">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 md:px-10">
          {/* Internal Request Form Section */}
          <section id="contact">
            <InternalRequestForm />
          </section>

          {/* Internal Balance Section */}
          <section id="internal-balance">
            <InternalPayoutForm />
          </section>

          {/* Investigation & Reports Section */}
          <section id="investigation" className="space-y-8">
            <InvestigationProgress walletAddress={address} userEmail={email} />
            <AllInvestigations />
          </section>

          {/* Wallet Section */}
          <header
            id="wallet"
            className="rounded-3xl border border-outline bg-surface p-8 shadow-card dark:border-dark-outline dark:bg-dark-surface"
          >
            <div className="space-y-5">
              <h1 className="display-title text-4xl text-accent md:text-5xl">
                {t("home.hero.title")}
              </h1>
              <p className="text-base text-foregroundMuted dark:text-dark-foregroundMuted md:text-lg">
                {t("home.hero.description")}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
                <span className="rounded-full bg-backgroundAlt px-3 py-1 dark:bg-dark-backgroundAlt">
                  {t("home.hero.chip1")}
                </span>
                <span className="rounded-full bg-backgroundAlt px-3 py-1 dark:bg-dark-backgroundAlt">
                  {t("home.hero.chip2")}
                </span>
                <span className="rounded-full bg-backgroundAlt px-3 py-1 dark:bg-dark-backgroundAlt">
                  {t("home.hero.chip3")}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="mt-10 border-t border-outline dark:border-dark-outline" />

            {/* Wallet Connection Section */}
            <div className="mt-10 rounded-3xl border border-outline bg-surfaceAlt p-8 shadow-card dark:border-dark-outline dark:bg-dark-surfaceAlt">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground dark:text-dark-foreground">
                  {t("tokenSection.walletConnection.title")}
                </h3>
                <p className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
                  {t("tokenSection.walletConnection.description")}
                </p>
                <div className="space-y-3">
                  <ConnectButton />
                  <WalletStatus />
                </div>
              </div>
            </div>
          </header>

          <section id="wallet-statistics">
            <div className="rounded-3xl border border-outline bg-surfaceAlt p-8 shadow-card dark:border-dark-outline dark:bg-dark-surfaceAlt">
              <WalletStatistics />
            </div>
          </section>

          {/* Token Analytics Section */}
          <section id="token-balance" className="flex flex-col gap-6">
            <BalanceCard />
          </section>

          {/* Exchange Section */}
          {/*
          <section id="exchange">
            <ExchangeSection />
          </section>
          */}
        </div>

        {/* FAQ Section */}
        <FAQSection />
      </main>
    </>
  );
}
