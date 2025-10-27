"use client";

import { useEffect } from "react";

export function ConsoleFilter() {
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    // Filter out SES/Enigma errors from MetaMask
    const filterFunction = (...args: unknown[]) => {
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
        return;
      }
      return message;
    };

    console.error = (...args: unknown[]) => {
      if (filterFunction(...args)) {
        originalError.apply(console, args);
      }
    };

    console.warn = (...args: unknown[]) => {
      if (filterFunction(...args)) {
        originalWarn.apply(console, args);
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
