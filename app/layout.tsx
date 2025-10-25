import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Rubik_Mono_One } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} bg-background font-sans text-foreground antialiased`}
      >
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
