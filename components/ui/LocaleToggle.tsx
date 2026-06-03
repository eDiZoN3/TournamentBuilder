"use client";

import { useLocale } from "@/components/ui/LocaleProvider";

interface LocaleToggleProps {
  className?: string;
}

export function LocaleToggle({ className = "" }: LocaleToggleProps) {
  const { locale, t, toggleLocale } = useLocale();
  const label =
    locale === "de"
      ? t("languageSwitchToEnglish")
      : t("languageSwitchToGerman");

  return (
    <button
      aria-label={label}
      aria-pressed={locale === "de"}
      className={`inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 px-2 text-xs font-bold uppercase text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-slate-600 ${className}`}
      onClick={toggleLocale}
      title={label}
      type="button"
    >
      {locale === "de" ? "EN" : "DE"}
    </button>
  );
}
