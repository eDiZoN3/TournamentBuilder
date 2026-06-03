"use client";

import { useLocale } from "@/components/ui/LocaleProvider";
import type { TranslationKey } from "@/lib/i18n";

interface LocalizedTextProps {
  k: TranslationKey;
}

export function LocalizedText({ k }: LocalizedTextProps) {
  const { t } = useLocale();

  return <>{t(k)}</>;
}
