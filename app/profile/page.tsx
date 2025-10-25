"use client";

import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletStatus } from "@/components/wallet/wallet-status";
import { useTranslation } from "@/hooks/use-translation";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const t = useTranslation();

  if (!isConnected) {
    return (
      <main className="dark:from-dark-background dark:to-dark-backgroundAlt min-h-screen bg-gradient-to-br from-background to-backgroundAlt py-12">
        <div className="mx-auto max-w-2xl px-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("wallet.statusDisconnected")}</CardTitle>
              <CardDescription>
                Please connect your MetaMask wallet to view your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/")}>Go to Home</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="dark:from-dark-background dark:to-dark-backgroundAlt min-h-screen bg-gradient-to-br from-background to-backgroundAlt py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-8">
          <h1 className="dark:text-dark-foreground text-3xl font-bold text-foreground">Profile</h1>
          <p className="dark:text-dark-foregroundMuted text-foregroundMuted">
            Your wallet information
          </p>
        </div>

        <div className="space-y-6">
          {/* Wallet Card */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Wallet</CardTitle>
              <CardDescription>Your MetaMask account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="dark:bg-dark-surfaceAlt flex items-center gap-4 rounded-lg bg-surfaceAlt p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
                  {address?.slice(2, 4).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="dark:text-dark-foreground font-mono font-medium text-foreground">
                    {address}
                  </div>
                  <div className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted">
                    MetaMask
                  </div>
                </div>
              </div>

              <WalletStatus />
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="dark:text-dark-foregroundMuted text-foregroundMuted">
                  Network:
                </span>
                <span className="dark:text-dark-foreground font-medium text-foreground">
                  Ethereum / Sepolia
                </span>
              </div>
              <div className="flex justify-between">
                <span className="dark:text-dark-foregroundMuted text-foregroundMuted">
                  Connected:
                </span>
                <span className="dark:text-dark-foreground font-medium text-foreground">Yes</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
