"use client";

import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletStatus } from "@/components/wallet/wallet-status";
import { DisconnectButton } from "@/components/wallet/disconnect-button";
import { UserRequests } from "@/components/profile/user-requests";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import { PageTitle } from "@/components/layout/page-title";
import { useWalletStatistics } from "@/hooks/use-wallet-statistics";
import { TOKEN_CONFIG } from "@/config/token";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, authType, email, name, image } = useAuth();
  const router = useRouter();
  const t = useTranslation();
  const { totalReceived, isLoading: isStatisticsLoading } = useWalletStatistics();
  const tokenSymbol = TOKEN_CONFIG.symbol || "TOKEN";

  const formatNumber = (value: string): string =>
    Number.parseFloat(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  const getAuthLabel = () => {
    if (authType === "wallet") return "MetaMask";
    if (authType === "email") {
      if (email?.includes("@gmail.com")) return "Google";
      return "Email";
    }
    return "";
  };

  if (!isAuthenticated) {
    return (
      <>
        <PageTitle title="Profile" description="Your wallet profile and requests" />
        <main className="min-h-screen bg-gradient-to-br from-background to-backgroundAlt py-12 dark:from-dark-background dark:to-dark-backgroundAlt">
          <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>{t("wallet.statusDisconnected")}</CardTitle>
                <CardDescription>{t("profile.connectWallet")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/")}>Go to Home</Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Profile" description="Your wallet profile and requests" />
      <main className="min-h-screen bg-gradient-to-br from-background to-backgroundAlt py-12 dark:from-dark-background dark:to-dark-backgroundAlt">
        <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">
              {t("profile.title")}
            </h1>
            <p className="text-foregroundMuted dark:text-dark-foregroundMuted">
              {t("profile.subtitle")}
            </p>
          </div>

          <div className="space-y-6">
            {/* Account Card */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>
                  {authType === "wallet" ? t("profile.connectedWallet.title") : "Connected Account"}
                </CardTitle>
                <CardDescription>
                  {authType === "wallet"
                    ? t("profile.connectedWallet.subtitle")
                    : "Your account details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg bg-surfaceAlt p-4 dark:bg-dark-surfaceAlt">
                  {/* Avatar/Icon */}
                  {authType === "wallet" && address ? (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent font-medium text-white">
                      {address.slice(2, 4).toUpperCase()}
                    </div>
                  ) : image ? (
                    <Image
                      src={image}
                      alt={name || email || "User"}
                      width={48}
                      height={48}
                      className="shrink-0 rounded-full"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent font-medium text-white">
                      {name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    {authType === "wallet" && address ? (
                      <>
                        <div className="break-all font-mono text-xs font-medium text-foreground dark:text-dark-foreground md:text-base">
                          {address}
                        </div>
                        <div className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
                          MetaMask
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-foreground dark:text-dark-foreground">
                          {name || email?.split("@")[0] || "User"}
                        </div>
                        {email && (
                          <div className="break-all text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
                            {email}
                          </div>
                        )}
                        <div className="mt-1 text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
                          {getAuthLabel()}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {authType === "wallet" && <WalletStatus />}

                <div className="flex justify-end border-t border-outline pt-4 dark:border-dark-outline">
                  {authType === "wallet" ? (
                    <DisconnectButton />
                  ) : (
                    <Button variant="outline" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>{t("profile.accountDetails.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-foregroundMuted dark:text-dark-foregroundMuted">
                    {t("profile.accountDetails.network")}
                  </span>
                  <span className="font-medium text-foreground dark:text-dark-foreground">
                    {t("profile.accountDetails.networkValue")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foregroundMuted dark:text-dark-foregroundMuted">
                    {t("profile.accountDetails.connected")}
                  </span>
                  <span className="font-medium text-foreground dark:text-dark-foreground">
                    {t("profile.accountDetails.connectedValue")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foregroundMuted dark:text-dark-foregroundMuted">
                    {t("wallet.statistics.receivedAmount")}
                  </span>
                  <span className="font-medium text-foreground dark:text-dark-foreground">
                    {isStatisticsLoading
                      ? t("wallet.statistics.loading")
                      : `${formatNumber(totalReceived)} ${tokenSymbol}`}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* My Requests */}
            {(address || email) && <UserRequests walletAddress={address} userEmail={email} />}
          </div>
        </div>
      </main>
    </>
  );
}
