"use client";

import { PropsWithChildren, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ThemeProvider } from "next-themes";
import { wagmiConfig } from "@/lib/wagmi";
import { LanguageProvider } from "@/components/providers/language-provider";
import { ConsoleFilter } from "@/components/providers/console-filter";
import { HelmetProvider } from "@/components/providers/helmet-provider";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <LanguageProvider>
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <ConsoleFilter />
              {children}
            </QueryClientProvider>
          </WagmiProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
