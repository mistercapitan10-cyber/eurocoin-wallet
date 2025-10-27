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
    
    // Function to setup observer
    const setupObserver = () => {
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
            if (sections.includes(sectionId)) {
              setActiveSection(sectionId);
            }
          }
        });
      };

      observer = new IntersectionObserver(observerCallback, observerOptions);

      // Observe all sections
      const sectionElements = sections
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);

      sectionElements.forEach((section) => observer.observe(section));
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
