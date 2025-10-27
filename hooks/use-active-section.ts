"use client";

import { useEffect, useState } from "react";

export function useActiveSection() {
  const [activeSection, setActiveSection] = useState<string>("home");

  useEffect(() => {
    const sections = ["exchange", "contact", "wallet", "investigation", "token-balance", "faq"];
    let observer: IntersectionObserver | null = null;
    let checkInterval: NodeJS.Timeout | null = null;

    // Check initial hash and update immediately
    const checkHash = () => {
      const hash = window.location.hash.slice(1); // Remove '#'
      console.log("[useActiveSection] Hash check:", hash);
      if (hash && sections.includes(hash)) {
        console.log("[useActiveSection] Setting active section from hash:", hash);
        setActiveSection(hash);
      }
    };

    checkHash();

    // Listen for hash changes (navigation clicks)
    const handleHashChange = () => {
      console.log("[useActiveSection] Hashchange event triggered!");
      checkHash();
    };

    window.addEventListener("hashchange", handleHashChange);
    console.log("[useActiveSection] Hashchange listener added");

    // Function to setup observer
    const setupObserver = () => {
      console.log("[useActiveSection] Setting up observer...");

      // Cancel previous observer if exists
      if (observer) {
        const elements = sections.map((id) => document.getElementById(id)).filter(Boolean);
        elements.forEach((el) => observer?.unobserve(el!));
      }

      const observerOptions = {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0.3,
      };

      const observerCallback = (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            console.log("[useActiveSection] Section intersecting:", sectionId);
            if (sections.includes(sectionId)) {
              console.log("[useActiveSection] Setting active section from scroll:", sectionId);
              setActiveSection(sectionId);
            }
          }
        });
      };

      observer = new IntersectionObserver(observerCallback, observerOptions);

      // Observe all sections
      const sectionElements = sections
        .map((id) => {
          const element = document.getElementById(id);
          console.log(
            `[useActiveSection] Looking for section "${id}":`,
            element ? "FOUND" : "NOT FOUND",
          );
          return element;
        })
        .filter((el): el is HTMLElement => el !== null);

      console.log(
        "[useActiveSection] Found sections:",
        sectionElements.map((el) => el.id),
      );

      if (observer && sectionElements.length > 0) {
        sectionElements.forEach((section) => observer!.observe(section));
      } else {
        console.log("[useActiveSection] No sections found or observer is null!");
      }
    };

    // Try to setup observer immediately
    setupObserver();

    // Also check periodically to catch late-rendered sections
    checkInterval = setInterval(() => {
      setupObserver();
    }, 1000);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      window.removeEventListener("hashchange", handleHashChange);
      if (observer) {
        const elements = sections.map((id) => document.getElementById(id)).filter(Boolean);
        elements.forEach((el) => observer?.unobserve(el!));
      }
    };
  }, []);

  return activeSection;
}
