"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function ScrollToTop(): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, [isMounted]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isMounted || !isVisible) {
    return <></>;
  }

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full bg-accent text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-accent/90"
      aria-label="Прокрутить наверх"
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </Button>
  );
}
