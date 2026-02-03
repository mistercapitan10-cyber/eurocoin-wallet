"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import Image from "next/image";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

export function ProfileIcon() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, disconnect, isConnecting } = useWalletConnection();
  const { isAuthenticated, authType, email, name, image } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslation();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleProfileClick = () => {
    router.push("/profile");
    setIsOpen(false);
  };

  const handleConnect = async () => {
    try {
      await connect();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      if (authType === "wallet" || isConnected) {
        await disconnect();
        Cookies.remove("metamask_connected");
        toast.success(t("wallet.disconnected"));
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        await signOut({ redirect: true, callbackUrl: "/login" });
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to sign out:", error);
      const message = error instanceof Error ? error.message : t("auth.signOutError");
      toast.error(message);
    }
  };

  const getAuthLabel = () => {
    if (authType === "wallet") return "MetaMask";
    if (authType === "email") {
      // Determine OAuth provider from email domain or name
      if (email?.includes("@gmail.com") || name?.includes("Google")) return "Google";
      if (email?.includes("@github") || name?.includes("GitHub")) return "GitHub";
      return "Email";
    }
    return "";
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-surfaceAlt text-foreground transition hover:bg-surface dark:bg-dark-surfaceAlt dark:text-dark-foreground dark:hover:bg-dark-surface"
        aria-label="Profile"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 z-50 min-w-[240px] rounded-lg border border-outline bg-surface p-3 shadow-lg dark:border-dark-outline dark:bg-dark-surface">
          {isAuthenticated ? (
            <>
              <div className="mb-3 flex items-center gap-3 rounded-md bg-surfaceAlt px-3 py-2 text-sm dark:bg-dark-surfaceAlt dark:text-dark-foreground">
                {/* Avatar */}
                {authType === "wallet" && address ? (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface font-medium text-accent dark:bg-dark-surface">
                    {address.slice(2, 4).toUpperCase()}
                  </div>
                ) : image ? (
                  <Image
                    src={image}
                    alt={name || email || "User"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface font-medium text-accent dark:bg-dark-surface">
                    {name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}

                {/* User Info */}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground dark:text-dark-foreground">
                    {authType === "wallet" && address
                      ? formatAddress(address)
                      : name || email?.split("@")[0] || "User"}
                  </div>
                  <div className="text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
                    {getAuthLabel()}
                  </div>
                </div>
              </div>

              {/* Profile Button (for all authenticated users) */}
              <button
                type="button"
                onClick={handleProfileClick}
                className="mb-2 w-full rounded-md px-3 py-2 text-left text-sm font-medium transition hover:bg-surfaceAlt dark:text-dark-foreground dark:hover:bg-dark-surfaceAlt"
              >
                {t("profile.title")}
              </button>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-surfaceAlt dark:text-dark-foreground dark:text-red-400 dark:hover:bg-dark-surfaceAlt"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="dark:bg-dark-accent dark:hover:bg-dark-accentAlt w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accentAlt disabled:opacity-50"
            >
              {isConnecting ? t("wallet.connecting") : t("wallet.connect")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
