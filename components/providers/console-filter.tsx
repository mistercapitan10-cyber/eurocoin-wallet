"use client";

import { useEffect } from "react";

export function ConsoleFilter() {
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    // Filter out SES/Enigma errors from MetaMask
    const shouldFilter = (...args: unknown[]): boolean => {
      const message = args[0];
      if (
        typeof message === "string" &&
        (message.includes("Removing intrinsics") ||
          message.includes("lockdown-install.js") ||
          message.includes("SES Removing") ||
          message.includes("unpermitted intrinsics") ||
          message.includes("%MapPrototype%") ||
          message.includes("%WeakMapPrototype%") ||
          message.includes("%DatePrototype%"))
      ) {
        return true;
      }
      return false;
    };

    console.error = (...args: unknown[]) => {
      if (!shouldFilter(...args)) {
        try {
          originalError.apply(console, args);
        } catch {
          // Fallback to direct call if apply fails
          originalError(...args);
        }
      }
    };

    console.warn = (...args: unknown[]) => {
      if (!shouldFilter(...args)) {
        try {
          originalWarn.apply(console, args);
        } catch {
          // Fallback to direct call if apply fails
          originalWarn(...args);
        }
      }
    };

    // Cleanup
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
