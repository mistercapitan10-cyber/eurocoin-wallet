"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InfoPage() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslation();

  const pages = {
    requests: {
      title: t("info.requests.title"),
      content: t("info.requests.content"),
      description: t("info.requests.description"),
    },
    terms: {
      title: t("info.terms.title"),
      content: t("info.terms.content"),
      description: t("info.terms.description"),
    },
    exchange: {
      title: t("info.exchange.title"),
      content: t("info.exchange.content"),
      description: t("info.exchange.description"),
    },
  };

  const page = pages[slug as keyof typeof pages];

  if (!page) {
    return (
      <main className="dark:from-dark-background dark:to-dark-backgroundAlt min-h-screen bg-gradient-to-br from-background to-backgroundAlt py-12">
        <div className="mx-auto max-w-4xl px-6">
          <Card>
            <CardContent className="py-12 text-center">
              <h1 className="dark:text-dark-foreground mb-4 text-2xl font-bold text-foreground">
                {t("info.notFound")}
              </h1>
              <Link href="/login" className="text-accent hover:text-accentAlt">
                {t("info.backToLogin")}
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/login"
            className="dark:text-dark-foreground flex items-center gap-2 text-foreground transition-colors hover:text-accent"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t("info.backToLogin")}
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="dark:text-dark-foreground text-3xl font-bold text-foreground">
              {page.title}
            </CardTitle>
            <p className="dark:text-dark-foregroundMuted text-base text-foregroundMuted">
              {page.description}
            </p>
          </CardHeader>
          <CardContent>
            <div
              className="dark:text-dark-foregroundMuted prose prose-slate max-w-none text-foregroundMuted dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

