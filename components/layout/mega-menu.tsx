"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useState, useRef, type ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface MenuCard {
  href: string;
  titleKey: string;
  descKey: string;
  icon: ReactElement;
  gradient: string;
}

const menuCards: MenuCard[] = [
  {
    href: "/#wallet",
    titleKey: "common.nav.wallet",
    descKey: "megaMenu.wallet.description",
    gradient: "from-blue-500 to-blue-600",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect
          x="3"
          y="6"
          width="18"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
        <circle cx="7" cy="15" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/#exchange",
    titleKey: "common.nav.exchange",
    descKey: "megaMenu.exchange.description",
    gradient: "from-blue-600 to-indigo-600",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7 16V4M7 4L3 8M7 4L11 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 8v12M17 20l4-4M17 20l-4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/#internal-balance",
    titleKey: "common.nav.internalBalance",
    descKey: "megaMenu.internalBalance.description",
    gradient: "from-amber-500 to-yellow-600",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20 12V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="2" y="6" width="20" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
        <path d="M12 12v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/#investigation",
    titleKey: "common.nav.investigation",
    descKey: "megaMenu.investigation.description",
    gradient: "from-blue-500 to-cyan-500",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function MegaMenu() {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [headerHeight, setHeaderHeight] = useState(73);
  const [isDesktop, setIsDesktop] = useState(true);
  const lastScrollY = useRef(0);

  useLayoutEffect(() => {
    // Calculate header height synchronously before paint
    const updateHeaderHeight = () => {
      const header = document.querySelector("header");
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    updateHeaderHeight();

    // Check if desktop
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkIsDesktop();

    const handleResize = () => {
      updateHeaderHeight();
      checkIsDesktop();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Close menu on scroll
      if (isOpen && Math.abs(currentScrollY - lastScrollY.current) > 50) {
        setIsOpen(false);
      }
      lastScrollY.current = currentScrollY;
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("scroll", handleScroll, { passive: true });
      lastScrollY.current = window.scrollY;
    }

    return () => {
      if (isOpen) {
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition dark:text-dark-foregroundMuted",
          isOpen
            ? "bg-accent text-white shadow"
            : "text-foregroundMuted hover:bg-backgroundAlt dark:hover:bg-dark-backgroundAlt",
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{t("megaMenu.features")}</span>
        <motion.svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Invisible Overlay for Click Outside */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Mega Menu Dropdown - Full Width */}
            <motion.div
              ref={menuRef}
              style={{ top: `${headerHeight}px` }}
              className="fixed left-0 z-50 w-full"
              initial={isDesktop ? { y: -20, opacity: 0 } : { opacity: 0 }}
              animate={isDesktop ? { y: 0, opacity: 1 } : { opacity: 1 }}
              exit={isDesktop ? { y: -20, opacity: 0 } : { opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3,
              }}
            >
              <div className="border-b border-outline bg-surface shadow-xl dark:border-dark-outline dark:bg-dark-surface">
                <div className="mx-auto max-w-6xl px-6 py-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground">
                        {t("megaMenu.exploreTitle")}
                      </h3>
                      <p className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
                        {t("megaMenu.exploreSubtitle")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-foregroundMuted transition hover:bg-surfaceAlt dark:text-dark-foregroundMuted dark:hover:bg-dark-surfaceAlt"
                      aria-label="Закрыть меню"
                    >
                      <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <motion.div
                    className="grid grid-cols-1 gap-6 sm:grid-cols-2"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.08,
                          delayChildren: 0.1,
                        },
                      },
                      hidden: {
                        transition: {
                          staggerChildren: 0.05,
                          staggerDirection: -1,
                        },
                      },
                    }}
                  >
                    {menuCards.map((card) => (
                      <motion.div
                        key={card.href}
                        variants={{
                          hidden: { y: -20, opacity: 0, scale: 0.95 },
                          visible: {
                            y: 0,
                            opacity: 1,
                            scale: 1,
                            transition: {
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                            },
                          },
                        }}
                      >
                        <Link
                          href={card.href}
                          onClick={() => setIsOpen(false)}
                          className="group relative block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                        >
                          <div
                            className={cn(
                              "absolute inset-0 bg-gradient-to-br opacity-95",
                              card.gradient,
                            )}
                          />
                          <div className="relative p-8">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 text-white shadow-lg backdrop-blur-sm">
                              {card.icon}
                            </div>
                            <h4 className="mb-3 text-xl font-bold text-white">
                              {t(card.titleKey)}
                            </h4>
                            <p className="text-base leading-relaxed text-white/95">
                              {t(card.descKey)}
                            </p>

                            {/* Arrow indicator */}
                            <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                              <svg
                                className="h-5 w-5 text-white"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M7 17L17 7M17 7H7M17 7V17"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Contact Section */}
                  <motion.div
                    className="mt-8 border-t border-outline/20 pt-6 dark:border-dark-outline/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <Link
                      href="/#contact"
                      onClick={() => setIsOpen(false)}
                      className="group flex items-center justify-between rounded-xl p-5 transition-all hover:bg-accent/10 hover:shadow-md dark:hover:bg-accent/20"
                    >
                      <div className="flex items-center gap-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                          <svg
                            className="h-7 w-7"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="mb-1 text-lg font-bold text-foreground dark:text-dark-foreground">
                            {t("common.nav.contact")}
                          </h4>
                          <p className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
                            {t("megaMenu.contact.description")}
                          </p>
                        </div>
                      </div>
                      <svg
                        className="h-6 w-6 text-accent transition-transform group-hover:translate-x-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 18l6-6-6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
