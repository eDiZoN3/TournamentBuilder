"use client";

import { useLocale } from "@/components/ui/LocaleProvider";
import type { TranslationKey } from "@/lib/i18n";

interface RoundTabsProps {
  activeRound: number;
  ariaLabel: string;
  onChange: (round: number) => void;
  rounds: Array<{
    label: string;
    round: number;
  }>;
}

function localizedRoundTabLabel(
  label: string,
  round: number,
  t: (key: TranslationKey) => string,
): string {
  if (/^lb final$/i.test(label.trim())) {
    return t("lbFinal");
  }

  if (/final/i.test(label)) {
    return t("final");
  }

  if (/semi/i.test(label)) {
    return t("semiFinal");
  }

  if (/quarter/i.test(label)) {
    return t("quarterFinal");
  }

  return `${t("round")} ${round}`;
}

export function RoundTabs({
  activeRound,
  ariaLabel,
  onChange,
  rounds,
}: RoundTabsProps) {
  const { t } = useLocale();

  if (rounds.length <= 1) {
    return null;
  }

  return (
    <div
      aria-label={ariaLabel}
      className="mb-4 flex gap-2 overflow-x-auto rounded-lg bg-slate-100 p-1 dark:bg-slate-800 md:hidden"
      role="group"
    >
      {rounds.map(({ label, round }) => (
        <button
          aria-pressed={activeRound === round}
          className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold ${
            activeRound === round
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
              : "text-slate-500 dark:text-slate-300"
          }`}
          key={round}
          onClick={() => onChange(round)}
          type="button"
        >
          {localizedRoundTabLabel(label, round, t)}
        </button>
      ))}
    </div>
  );
}
