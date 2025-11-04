"use client";

import Link from "next/link";
import Image from "next/image";
import { PageTitle } from "@/components/layout/page-title";
import { useRouter } from "next/navigation";
import { useEffect, useRef, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { OAuthButtons, AuthDivider, EmailSignInForm } from "@/components/auth";
import { MetaMaskQR } from "@/components/metamask";
import { EuroCoin3D, EuroCoinInfoSection } from "@/components/eurocoin";
import { ReviewsCarousel } from "@/components/reviews";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useSearchParams } from "next/navigation";

// Component that uses useSearchParams - must be wrapped in Suspense
function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connect, isConnecting, isConnected } = useWalletConnection();
  const { isAuthenticated, isLoading } = useAuth();
  const t = useTranslation();
  const hasRedirected = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownError = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch - use startTransition to avoid cascading renders
  useEffect(() => {
    // Use setTimeout to defer state update after initial render
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Handle authentication errors from URL params
  useEffect(() => {
    const error = searchParams.get("error");
    if (error && !hasShownError.current) {
      hasShownError.current = true;

      let errorMessage = "";
      switch (error) {
        case "Configuration":
          errorMessage = "Authentication configuration error. Please check server settings.";
          console.error("[Login] Configuration error detected. Check NextAuth setup.");
          break;
        case "AccessDenied":
          errorMessage = "Access denied. Please try again.";
          break;
        case "Verification":
          errorMessage = "Verification failed. Please try again.";
          break;
        default:
          errorMessage = `Authentication error: ${error}`;
      }

      toast.error(errorMessage);
      console.error("[Login] Auth error from URL:", error);

      // Remove error from URL after showing
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

  // Redirect if already authenticated
  // NOTE: Server-side middleware handles redirects for page navigation,
  // but we need client-side redirect for real-time authentication state changes
  useEffect(() => {
    console.log("[Login] useEffect triggered", {
      isAuthenticated,
      isLoading,
      hasRedirected: hasRedirected.current,
    });

    // Don't redirect if still loading or already redirected
    if (isLoading || hasRedirected.current) {
      return;
    }

    // If authenticated, redirect to home page
    if (isAuthenticated) {
      console.log("[Login] User authenticated, redirecting to home...");
      hasRedirected.current = true;

      // Clear any pending timeouts
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }

      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
    };
  }, []);

  const handleMetaMaskConnect = async () => {
    try {
      // Clear any existing timeouts
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }

      // If already connected, just set cookie and redirect
      if (isConnected) {
        Cookies.set("metamask_connected", "true", { expires: 7 }); // 7 days
        toast.success(t("login.walletConnected"));

        // Set flag that redirect will happen
        hasRedirected.current = false;

        // Redirect after 1.5 seconds
        redirectTimeoutRef.current = setTimeout(() => {
          hasRedirected.current = true;
          if (fallbackTimeoutRef.current) {
            clearTimeout(fallbackTimeoutRef.current);
            fallbackTimeoutRef.current = null;
          }
          router.push("/");
        }, 1500);

        // Fallback: reload page if redirect didn't happen in 3 seconds
        fallbackTimeoutRef.current = setTimeout(() => {
          if (!hasRedirected.current) {
            console.log("[Login] Redirect timeout, reloading page...");
            window.location.reload();
          }
        }, 3000);
        return;
      }

      // If not connected, try to connect
      await connect();
      // Set cookie to indicate successful MetaMask connection
      Cookies.set("metamask_connected", "true", { expires: 7 }); // 7 days
      toast.success(t("login.walletConnectedSuccess"));

      // Set flag that redirect will happen
      hasRedirected.current = false;

      // Redirect to home page after successful connection
      redirectTimeoutRef.current = setTimeout(() => {
        hasRedirected.current = true;
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
          fallbackTimeoutRef.current = null;
        }
        router.push("/");
      }, 1500);

      // Fallback: reload page if redirect didn't happen in 3 seconds
      fallbackTimeoutRef.current = setTimeout(() => {
        if (!hasRedirected.current) {
          console.log("[Login] Redirect timeout after MetaMask connection, reloading page...");
          window.location.reload();
        }
      }, 3000);
    } catch (error) {
      // Clear timeouts on error
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }

      const message = error instanceof Error ? error.message : t("login.connectError");
      toast.error(message);
    }
  };

  return (
    <>
      <PageTitle title="Login" description="Connect your MetaMask wallet" />
      <main className="min-h-screen bg-gradient-to-br from-backgroundAlt to-background dark:from-dark-backgroundAlt dark:to-dark-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 md:py-16">
          <div className="flex-1 space-y-4 sm:space-y-6">
            <span className="pill bg-surface text-xs text-foreground dark:bg-dark-surface dark:text-dark-foreground sm:text-sm">
              {t("login.badge")}
            </span>
            <h1 className="text-3xl font-bold text-accent sm:text-4xl md:text-5xl">
              {t("login.heading")}
            </h1>
            <p className="max-w-xl text-sm text-foregroundMuted dark:text-dark-foregroundMuted sm:text-base md:text-lg">
              {t("login.descriptionText")}
            </p>
            <div className="flex flex-col gap-3 rounded-2xl border border-outline bg-surface p-4 shadow-card dark:border-dark-outline dark:bg-dark-surface sm:gap-4 sm:rounded-3xl sm:p-6">
              {/* MetaMask Button */}
              <Button
                size="lg"
                fullWidth
                onClick={handleMetaMaskConnect}
                disabled={isConnecting || isLoading || !isMounted}
              >
                {!isMounted
                  ? t("login.connect")
                  : isConnecting
                    ? t("login.connecting")
                    : isConnected
                      ? t("login.continue")
                      : t("login.connect")}
              </Button>

              {/* Divider */}
              <AuthDivider />

              {/* OAuth Buttons */}
              <OAuthButtons callbackUrl="/" disabled={isLoading} />

              {/* Divider */}
              <AuthDivider />

              {/* Email login */}
              <EmailSignInForm callbackUrl="/" disabled={isLoading} />

              <p className="text-[10px] text-foregroundMuted dark:text-dark-foregroundMuted sm:text-xs">
                {t("login.disclaimer")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-foregroundMuted dark:text-dark-foregroundMuted sm:gap-4 sm:text-xs">
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

        {/* EuroCoin Info Section */}
        <EuroCoinInfoSection />

        {/* EuroCoin 3D Presentation Section */}
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 md:px-10">
          <section>
            <div className="mb-4 text-center sm:mb-6">
              <h2 className="mb-2 text-2xl font-bold text-foreground dark:text-dark-foreground sm:text-3xl">
                {t("eurocoin.sectionTitle")}
              </h2>
              <p className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted sm:text-base">
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
    </>
  );
}

// Export default with Suspense boundary for useSearchParams
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
