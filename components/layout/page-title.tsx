"use client";

import { Helmet } from "react-helmet-async";
import { useMemo, useEffect } from "react";
import { useActiveSection } from "@/hooks/use-active-section";

interface PageTitleProps {
  title: string;
  description?: string;
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

export function PageTitle({ title, description, enableSectionTracking = false }: PageTitleProps) {
  const activeSection = useActiveSection();

  const dynamicTitle = useMemo(() => {
    if (enableSectionTracking && activeSection !== "home") {
      const sectionTitle = SECTION_TITLES[activeSection] || activeSection;
      return `${sectionTitle} - EuroCoin`;
    }
    return `${title} - EuroCoin`;
  }, [title, enableSectionTracking, activeSection]);

  const dynamicDescription = useMemo(() => {
    if (!enableSectionTracking) return description;

    const descriptions: Record<string, string> = {
      exchange: "Convert corporate tokens to fiat via Telegram",
      contact: "Submit internal token operation requests",
      wallet: "Manage your cryptocurrency wallet",
      investigation: "Track fraud investigation progress",
      "token-balance": "View your token balance and price",
      faq: "Frequently asked questions",
    };

    return descriptions[activeSection] || description;
  }, [description, enableSectionTracking, activeSection]);

  // Update document.title directly for immediate effect
  useEffect(() => {
    console.log("[PageTitle] Active section:", activeSection);
    console.log("[PageTitle] Dynamic title:", dynamicTitle);
    console.log("[PageTitle] Setting document.title to:", dynamicTitle);
    document.title = dynamicTitle;
  }, [dynamicTitle, activeSection]);

  return (
    <Helmet>
      <title>{dynamicTitle}</title>
      {dynamicDescription && <meta name="description" content={dynamicDescription} />}
    </Helmet>
  );
}
