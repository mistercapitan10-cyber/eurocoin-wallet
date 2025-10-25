"use client";

import { BalanceCard } from "./balance-card";
import { PriceTicker } from "./price-ticker";
import { TaxCard } from "./tax-card";

export function WalletDashboard(): JSX.Element {
  return (
    <section className="grid gap-6 md:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <BalanceCard />
        <PriceTicker />
      </div>
      <TaxCard />
    </section>
  );
}
