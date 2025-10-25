'use client';
import { useTranslation } from "@/hooks/use-translation";

export function SiteFooter(): JSX.Element {
  const t = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-outline bg-surface/95">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-6 text-xs text-foregroundMuted md:flex-row md:items-center md:justify-between md:px-10">
        <span>{t("common.footer.copyright", { year })}</span>
        <div className="flex flex-wrap gap-3">
          <span>{t("common.footer.contact")}</span>
          <span>{t("common.footer.policy")}</span>
          <span>{t("common.footer.version")}</span>
        </div>
      </div>
    </footer>
  );
}
