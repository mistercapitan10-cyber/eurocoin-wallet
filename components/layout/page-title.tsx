"use client";

import { useMemo, useEffect } from "react";
import { useActiveSection } from "@/hooks/use-active-section";

interface PageTitleProps {
  title: string;
  description?: string; // Kept for interface consistency
  enableSectionTracking?: boolean;
}

const SECTION_TITLES: Record<string, string> = {
  exchange: "Exchange",
  contact: "Contact",
  wallet: "Wallet",
  investigation: "Investigation",
  "token-balance": "Token",
  faq: "FAQ",
  home: "Dashboard",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PageTitle({ title, description, enableSectionTracking = false }: PageTitleProps) {
  console.log("[PageTitle] Component rendered, enableSectionTracking:", enableSectionTracking);
  const activeSection = useActiveSection();
  console.log("[PageTitle] Current activeSection:", activeSection);

  const dynamicTitle = useMemo(() => {
    console.log(
      "[PageTitle] Computing dynamicTitle, enableSectionTracking:",
      enableSectionTracking,
      "activeSection:",
      activeSection,
    );
    if (enableSectionTracking && activeSection !== "home") {
      const sectionTitle = SECTION_TITLES[activeSection] || activeSection;
      const result = `${sectionTitle} - EuroCoin`;
      console.log("[PageTitle] Computed title from section:", result);
      return result;
    }
    const result = `${title} - EuroCoin`;
    console.log("[PageTitle] Computed title from props:", result);
    return result;
  }, [title, enableSectionTracking, activeSection]);

  // Description is no longer used since we removed Helmet
  // Keeping for future use if needed

  // Update document.title directly for immediate effect
  useEffect(() => {
    console.log("[PageTitle] Active section:", activeSection);
    console.log("[PageTitle] Dynamic title:", dynamicTitle);
    console.log("[PageTitle] Setting document.title to:", dynamicTitle);

    // Force update the title
    document.title = dynamicTitle;

    // Also update the meta tag if it exists
    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) {
      metaTitle.setAttribute("content", dynamicTitle);
    }

    console.log("[PageTitle] Updated! Current document.title:", document.title);
  }, [dynamicTitle, activeSection]);

  // Don't use Helmet - we update document.title directly in useEffect
  // This avoids conflicts with Next.js metadata
  return null;
}
