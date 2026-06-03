"use client";

import type { ITournament } from "@/lib/models/Tournament";
import { useLocale } from "@/components/ui/LocaleProvider";

interface StatusBadgeProps {
  status: ITournament["status"];
}

const styles: Record<ITournament["status"], string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  completed: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useLocale();
  const labels: Record<ITournament["status"], string> = {
    active: t("active"),
    completed: t("completed"),
    draft: t("draft"),
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
