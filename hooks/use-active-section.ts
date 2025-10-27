"use client";

import { useEffect, useState } from "react";

export function useActiveSection() {
  const [activeSection, setActiveSection] = useState<string>("home");

  useEffect(() => {
    const sections = ["exchange", "contact", "wallet", "investigation", "token-balance", "faq"];

    // Check initial hash
    const checkHash = () => {
      const hash = window.location.hash.slice(1); // Remove '#'
      if (hash && sections.includes(hash)) {
        setActiveSection(hash);
      }
    };

    checkHash();

    // Listen for hash changes (navigation clicks)
    const handleHashChange = () => {
      checkHash();
    };

    window.addEventListener("hashchange", handleHashChange);

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0.3,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          if (sections.includes(sectionId)) {
            setActiveSection(sectionId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    const sectionElements = sections
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    sectionElements.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      sectionElements.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return activeSection;
}
