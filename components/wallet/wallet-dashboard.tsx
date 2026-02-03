"use client";

import { BalanceCard } from "./balance-card";
import { PriceTicker } from "./price-ticker";

export function WalletDashboard() {
  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-6">
        <BalanceCard />
        <PriceTicker />
      </div>
    </section>
  );
}
