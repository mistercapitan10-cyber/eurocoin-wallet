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

export function ProfileIcon() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, isConnecting } = useWalletConnection();
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
      await signOut({ redirect: true, callbackUrl: '/login' });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const getAuthLabel = () => {
    if (authType === 'wallet') return 'MetaMask';
    if (authType === 'email') {
      // Determine OAuth provider from email domain or name
      if (email?.includes('@gmail.com') || name?.includes('Google')) return 'Google';
      if (email?.includes('@github') || name?.includes('GitHub')) return 'GitHub';
      return 'Email';
    }
    return '';
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="dark:bg-dark-surfaceAlt dark:text-dark-foreground dark:hover:bg-dark-surface flex h-10 w-10 items-center justify-center rounded-full bg-surfaceAlt text-foreground transition hover:bg-surface"
        aria-label="Profile"
      >
        <svg
          width="20"
          height="20"
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
        <div className="dark:border-dark-outline dark:bg-dark-surface absolute right-0 top-12 z-50 min-w-[240px] rounded-lg border border-outline bg-surface p-3 shadow-lg">
          {isAuthenticated ? (
            <>
              <div className="dark:text-dark-foreground dark:bg-dark-surfaceAlt mb-3 flex items-center gap-3 rounded-md bg-surfaceAlt px-3 py-2 text-sm">
                {/* Avatar */}
                {authType === 'wallet' && address ? (
                  <div className="dark:bg-dark-surface flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface text-accent font-medium">
                    {address.slice(2, 4).toUpperCase()}
                  </div>
                ) : image ? (
                  <Image
                    src={image}
                    alt={name || email || 'User'}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="dark:bg-dark-surface flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface text-accent font-medium">
                    {name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="dark:text-dark-foreground font-medium text-foreground truncate">
                    {authType === 'wallet' && address
                      ? formatAddress(address)
                      : name || email?.split('@')[0] || 'User'}
                  </div>
                  <div className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted">
                    {getAuthLabel()}
                  </div>
                </div>
              </div>

              {/* Profile Button (for all authenticated users) */}
              <button
                type="button"
                onClick={handleProfileClick}
                className="dark:text-dark-foreground dark:hover:bg-dark-surfaceAlt w-full rounded-md px-3 py-2 text-left text-sm font-medium transition hover:bg-surfaceAlt mb-2"
              >
                {t("profile.title")}
              </button>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleSignOut}
                className="dark:text-dark-foreground dark:hover:bg-dark-surfaceAlt w-full rounded-md px-3 py-2 text-left text-sm font-medium transition hover:bg-surfaceAlt text-red-600 dark:text-red-400"
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
