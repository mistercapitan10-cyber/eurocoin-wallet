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

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, authType, email, name, image } = useAuth();
  const router = useRouter();
  const t = useTranslation();

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  const getAuthLabel = () => {
    if (authType === 'wallet') return 'MetaMask';
    if (authType === 'email') {
      if (email?.includes('@gmail.com')) return 'Google';
      return 'Email';
    }
    return '';
  };

  if (!isAuthenticated) {
    return (
      <>
        <PageTitle title="Profile" description="Your wallet profile and requests" />
        <main className="dark:from-dark-background dark:to-dark-backgroundAlt min-h-screen bg-gradient-to-br from-background to-backgroundAlt py-12">
          <div className="mx-auto max-w-2xl px-6">
            <Card>
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
      <main className="dark:from-dark-background dark:to-dark-backgroundAlt min-h-screen bg-gradient-to-br from-background to-backgroundAlt py-12">
        <div className="mx-auto max-w-2xl px-6">
          <div className="mb-8">
            <h1 className="dark:text-dark-foreground text-3xl font-bold text-foreground">
              {t("profile.title")}
            </h1>
            <p className="dark:text-dark-foregroundMuted text-foregroundMuted">
              {t("profile.subtitle")}
            </p>
          </div>

          <div className="space-y-6">
            {/* Account Card */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {authType === 'wallet' ? t("profile.connectedWallet.title") : "Connected Account"}
                </CardTitle>
                <CardDescription>
                  {authType === 'wallet' ? t("profile.connectedWallet.subtitle") : "Your account details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="dark:bg-dark-surfaceAlt flex items-center gap-4 rounded-lg bg-surfaceAlt p-4">
                  {/* Avatar/Icon */}
                  {authType === 'wallet' && address ? (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white font-medium">
                      {address.slice(2, 4).toUpperCase()}
                    </div>
                  ) : image ? (
                    <Image
                      src={image}
                      alt={name || email || 'User'}
                      width={48}
                      height={48}
                      className="rounded-full shrink-0"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white font-medium">
                      {name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    {authType === 'wallet' && address ? (
                      <>
                        <div className="dark:text-dark-foreground break-all font-mono text-xs font-medium text-foreground md:text-base">
                          {address}
                        </div>
                        <div className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted">
                          MetaMask
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="dark:text-dark-foreground font-medium text-foreground">
                          {name || email?.split('@')[0] || 'User'}
                        </div>
                        {email && (
                          <div className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted break-all">
                            {email}
                          </div>
                        )}
                        <div className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted mt-1">
                          {getAuthLabel()}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {authType === 'wallet' && <WalletStatus />}

                <div className="dark:border-dark-outline flex justify-end border-t border-outline pt-4">
                  {authType === 'wallet' ? (
                    <DisconnectButton />
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.accountDetails.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="dark:text-dark-foregroundMuted text-foregroundMuted">
                    {t("profile.accountDetails.network")}
                  </span>
                  <span className="dark:text-dark-foreground font-medium text-foreground">
                    {t("profile.accountDetails.networkValue")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-dark-foregroundMuted text-foregroundMuted">
                    {t("profile.accountDetails.connected")}
                  </span>
                  <span className="dark:text-dark-foreground font-medium text-foreground">
                    {t("profile.accountDetails.connectedValue")}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* My Requests */}
            {(address || email) && (
              <UserRequests
                walletAddress={address}
                userEmail={email}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
