"use client";

import Link from "next/link";
import Image from "next/image";
import { PageTitle } from "@/components/layout/page-title";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { MetaMaskQR } from "@/components/metamask";
import { EuroCoin3D } from "@/components/eurocoin";
import { ReviewsCarousel } from "@/components/reviews";
import { useTranslation } from "@/hooks/use-translation";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

export default function LoginPage() {
  const router = useRouter();
  const { connect, isConnecting, isConnected } = useWalletConnection();
  const t = useTranslation();

  const handleMetaMaskConnect = async () => {
    try {
      // If already connected, just set cookie and redirect
      if (isConnected) {
        Cookies.set("metamask_connected", "true", { expires: 7 }); // 7 days
        toast.success(t("login.walletConnected"));
        setTimeout(() => {
          router.push("/");
        }, 1500);
        return;
      }

      // If not connected, try to connect
      await connect();
      // Set cookie to indicate successful MetaMask connection
      Cookies.set("metamask_connected", "true", { expires: 7 }); // 7 days
      toast.success(t("login.walletConnectedSuccess"));
      // Redirect to home page after successful connection
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("login.connectError");
      toast.error(message);
    }
  };

  return (
    <>
      <PageTitle title="Login" description="Connect your MetaMask wallet" />
      <main className="dark:from-dark-backgroundAlt dark:to-dark-background min-h-screen bg-gradient-to-br from-backgroundAlt to-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 md:py-16">
        <div className="flex-1 space-y-4 sm:space-y-6">
          <span className="pill dark:bg-dark-surface dark:text-dark-foreground bg-surface text-xs text-foreground sm:text-sm">
            {t("login.badge")}
          </span>
          <h1 className="text-3xl font-bold text-accent sm:text-4xl md:text-5xl">
            {t("login.heading")}
          </h1>
          <p className="dark:text-dark-foregroundMuted max-w-xl text-sm text-foregroundMuted sm:text-base md:text-lg">
            {t("login.descriptionText")}
          </p>
          <div className="dark:border-dark-outline dark:bg-dark-surface flex flex-col gap-3 rounded-2xl border border-outline bg-surface p-4 shadow-card sm:gap-4 sm:rounded-3xl sm:p-6">
            <Button size="lg" fullWidth onClick={handleMetaMaskConnect} disabled={isConnecting}>
              {isConnecting
                ? t("login.connecting")
                : isConnected
                  ? t("login.continue")
                  : t("login.connect")}
            </Button>
            <p className="dark:text-dark-foregroundMuted text-[10px] text-foregroundMuted sm:text-xs">
              {t("login.disclaimer")}
            </p>
          </div>
          <div className="dark:text-dark-foregroundMuted flex flex-wrap gap-3 text-[10px] text-foregroundMuted sm:gap-4 sm:text-xs">
            <Link href="/info/requests" className="underline hover:text-accent">
              {t("login.link.requests")}
            </Link>
            <Link href="/info/terms" className="underline hover:text-accent">
              {t("login.link.terms")}
            </Link>
            <Link href="/info/exchange" className="underline hover:text-accent">
              {t("login.link.exchange")}
            </Link>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center sm:hidden">
          <Image
            src="/coinPNG.png"
            alt="EUROCOIN Logo"
            width={200}
            height={200}
            className="object-contain"
            priority
          />
        </div>
        <div className="hidden flex-1 items-center justify-center sm:flex">
          <Image
            src="/coinPNG.png"
            alt="EUROCOIN Logo"
            width={300}
            height={300}
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* EuroCoin 3D Presentation Section */}
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 md:px-10">
        <section>
          <div className="mb-4 text-center sm:mb-6">
            <h2 className="dark:text-dark-foreground mb-2 text-2xl font-bold text-foreground sm:text-3xl">
              {t("eurocoin.sectionTitle")}
            </h2>
            <p className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted sm:text-base">
              {t("eurocoin.sectionDescription")}
            </p>
          </div>
          <EuroCoin3D />
        </section>
      </div>

      {/* Download MetaMask Section */}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-10">
        <MetaMaskQR />
      </div>

      {/* Reviews Section */}
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 md:px-10">
        <ReviewsCarousel />
      </div>
    </main>
  );
}
