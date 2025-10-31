import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Rubik_Mono_One } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ChatWidget } from "@/components/chatbot";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const displayFont = Rubik_Mono_One({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EuroCoin",
  description: "Internal dashboard for managing EuroCoin token balances",
  icons: {
    icon: "/coinPNG.png",
    shortcut: "/coinPNG.png",
    apple: "/coinPNG.png",
  },
  // Metadata will be dynamically updated by PageTitle component
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} dark:bg-dark-background dark:text-dark-foreground bg-background font-sans text-foreground antialiased`}
      >
        <AppProviders>
          <div className="dark:bg-dark-background flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--surface)",
                color: "var(--foreground)",
                border: "1px solid var(--outline)",
                opacity: 1,
              },
              className: "opacity-100",
            }}
          />
          <ChatWidget delay={10000} position="bottom-right" />
        </AppProviders>
      </body>
    </html>
  );
}
