"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";

export function EuroCoinInfoSection() {
  const t = useTranslation();

  const features = [
    {
      key: "type",
      label: t("eurocoin.info.features.type.label"),
      value: t("eurocoin.info.features.type.value"),
    },
    {
      key: "decimals",
      label: t("eurocoin.info.features.decimals.label"),
      value: t("eurocoin.info.features.decimals.value"),
    },
    {
      key: "blockchain",
      label: t("eurocoin.info.features.blockchain.label"),
      value: t("eurocoin.info.features.blockchain.value"),
    },
    {
      key: "symbol",
      label: t("eurocoin.info.features.symbol.label"),
      value: t("eurocoin.info.features.symbol.value"),
    },
  ];

  return (
    <section className="py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-10">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-10 md:mb-12">
          <h2 className="dark:text-dark-foreground mb-3 text-3xl font-bold text-foreground sm:mb-4 sm:text-4xl md:text-5xl">
            {t("eurocoin.info.title")}
          </h2>
          <p className="dark:text-dark-foregroundMuted mx-auto max-w-3xl text-sm leading-relaxed text-foregroundMuted sm:text-base md:text-lg">
            {t("eurocoin.info.subtitle")}
          </p>
        </div>

        {/* Main Description */}
        <Card className="dark:border-dark-outline dark:bg-dark-surface mb-6 border border-outline bg-surface shadow-card sm:mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-4 sm:space-y-5">
              <p className="dark:text-dark-foreground text-sm leading-relaxed text-foreground sm:text-base">
                {t("eurocoin.info.description.paragraph1")}
              </p>
              <p className="dark:text-dark-foregroundMuted text-sm leading-relaxed text-foregroundMuted sm:text-base">
                {t("eurocoin.info.description.paragraph2")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-6 sm:mb-8">
          <h3 className="dark:text-dark-foreground mb-4 text-xl font-semibold text-foreground sm:mb-6 sm:text-2xl">
            {t("eurocoin.info.features.title")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.key}
                className="dark:border-dark-outline dark:bg-dark-surface border border-outline bg-surface shadow-card transition-all hover:shadow-card-hover"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="mb-2 text-sm font-medium text-accent sm:text-base">
                    {feature.label}
                  </div>
                  {feature.isAddress ? (
                    <code className="dark:text-dark-foregroundMuted break-all text-xs text-foregroundMuted sm:text-sm">
                      {feature.value}
                    </code>
                  ) : (
                    <div className="dark:text-dark-foreground text-sm font-semibold text-foreground sm:text-base">
                      {feature.value}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <Card className="dark:border-dark-outline dark:bg-dark-surface border border-outline bg-surface shadow-card">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-4 sm:space-y-5">
              <p className="dark:text-dark-foregroundMuted text-sm leading-relaxed text-foregroundMuted sm:text-base">
                {t("eurocoin.info.additional")}
              </p>
              <div className="dark:border-dark-outline dark:bg-dark-backgroundAlt rounded-lg border border-outline bg-backgroundAlt p-4 sm:p-5">
                <h4 className="dark:text-dark-foreground mb-2 text-base font-semibold text-foreground sm:text-lg">
                  {t("eurocoin.info.license.title")}
                </h4>
                <p className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted sm:text-base">
                  {t("eurocoin.info.license.description")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
