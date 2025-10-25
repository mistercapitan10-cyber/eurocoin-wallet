'use client';
import { useLanguage } from "@/components/providers/language-provider";

export const useTranslation = (): ((
  key: string,
  vars?: Record<string, string | number>,
) => string) => {
  const { t } = useLanguage();
  return t;
};
