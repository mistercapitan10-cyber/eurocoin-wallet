"use client";

import { useEffect, useMemo, useState } from "react";

const SECTION_IDS = [
  "contact",
  "investigation",
  "token-balance",
  "wallet",
  "exchange",
  "faq",
];

const DEFAULT_SECTION = "home";

export function useActiveSection(): string {
  const [activeSection, setActiveSection] = useState<string>(DEFAULT_SECTION);

  const sections = useMemo(() => SECTION_IDS, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const getSectionFromHash = (): string | null => {
      const hash = window.location.hash?.slice(1);
      return hash && sections.includes(hash) ? hash : null;
    };

    const computeActiveSection = (): string => {
      const scrollPosition = window.scrollY + 160; // account for sticky header

      let current: string = DEFAULT_SECTION;
      for (const id of sections) {
        const element = document.getElementById(id);
        if (!element) {
          continue;
        }

        const elementTop = element.offsetTop;
        if (scrollPosition >= elementTop) {
          current = id;
        } else {
          break;
        }
      }

      return current;
    };

    const applyActiveSection = (next: string) => {
      setActiveSection((prev) => (prev === next ? prev : next));
    };

    let ticking = false;

    const handleScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        const next = computeActiveSection();
        applyActiveSection(next);
      });
    };

    const handleHashChange = () => {
      const fromHash = getSectionFromHash();
      if (fromHash) {
        applyActiveSection(fromHash);
      } else {
        handleScroll();
      }
    };

    // Initialize from hash or current scroll position
    const initialFromHash = getSectionFromHash();
    if (initialFromHash) {
      applyActiveSection(initialFromHash);
    } else {
      handleScroll();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [sections]);

  return activeSection;
}
