"use client";

import { BalanceCard } from "./balance-card";

export function WalletDashboard() {
  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-6">
        <BalanceCard />
      </div>
    </section>
  );
}
