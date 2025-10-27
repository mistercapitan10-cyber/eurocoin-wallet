"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";

export function FAQSection() {
  const t = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
    }, 100);
  }, []);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"];

  if (!isMounted) {
    return (
      <section id="faq" className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 h-8 w-48 animate-pulse rounded bg-surfaceAlt dark:bg-dark-surfaceAlt" />
            <div className="h-4 w-full animate-pulse rounded bg-surfaceAlt dark:bg-dark-surfaceAlt" />
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-surfaceAlt dark:bg-dark-surfaceAlt" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="faq" className="py-16">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground dark:text-dark-foreground">{t("faq.title")}</h2>
          <p className="text-lg text-foregroundMuted dark:text-dark-foregroundMuted">{t("faq.description")}</p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqKeys.map((key) => {
            const isOpen = openItems.has(key);
            const question = t(`faq.questions.${key}.question`);
            const answer = t(`faq.questions.${key}.answer`);

            return (
              <Card
                key={key}
                className="overflow-hidden transition-all duration-200 hover:shadow-card-hover"
              >
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleItem(key)}
                    className="w-full px-6 py-4 text-left transition-colors hover:bg-surfaceAlt dark:hover:bg-dark-surfaceAlt"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="pr-4 text-lg font-semibold text-foreground dark:text-dark-foreground">{question}</h3>
                      <div className="flex-shrink-0">
                        <svg
                          className={`h-5 w-5 text-foregroundMuted transition-transform duration-200 dark:text-dark-foregroundMuted ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-6 pb-4">
                      <div className="border-t border-outline pt-4 dark:border-dark-outline">
                        <p className="leading-relaxed text-foregroundMuted dark:text-dark-foregroundMuted">{answer}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-accentAlt/5 dark:border-accent/30 dark:from-accent/10 dark:to-accentAlt/10">
            <CardContent className="p-8">
              <h3 className="mb-4 text-xl font-semibold text-foreground dark:text-dark-foreground">
                {t("faq.contact.title")}
              </h3>
              <p className="mb-6 text-foregroundMuted dark:text-dark-foregroundMuted">
                {t("faq.contactCTA.description")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href="https://t.me/corporate_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-accent/90"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.61 7.59c-.12.54-.44.68-.89.42l-2.46-1.81-1.19 1.15c-.13.13-.24.24-.49.24l.18-2.55 4.57-4.12c.2-.18-.04-.28-.31-.1l-5.64 3.55-2.43-.76c-.53-.16-.54-.53.11-.79l9.46-3.65c.44-.16.83.1.69.79z" />
                  </svg>
                  {t("faq.contactCTA.telegramButton")}
                </a>
                <a
                  href="mailto:treasury@company.io"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline bg-surface px-6 py-3 text-foreground transition-colors hover:bg-surfaceAlt dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground dark:hover:bg-dark-surfaceAlt"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {t("faq.contactCTA.emailButton")}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
