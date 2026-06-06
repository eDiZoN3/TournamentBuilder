"use client";

import type { AdminDashboardMetrics } from "@/lib/admin/dashboardMetrics";
import { useLocale } from "@/components/ui/LocaleProvider";

interface DashboardMetricsProps {
  metrics: AdminDashboardMetrics;
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const { locale, t } = useLocale();
  const statusDetailLabel = (key: "draft" | "active" | "completed") =>
    locale === "en" ? t(key).toLowerCase() : t(key);
  const cards = [
    {
      label: t("registeredPlayers"),
      value: metrics.registeredPlayers,
      detail: t("playerAccount"),
    },
    {
      label: t("registeredAdmins"),
      value: metrics.registeredAdmins,
      detail: t("account"),
    },
    {
      label: t("registeredTournaments"),
      value: metrics.registeredTournaments,
      detail: `${metrics.tournamentsByStatus.draft} ${statusDetailLabel("draft")} / ${metrics.tournamentsByStatus.active} ${statusDetailLabel("active")} / ${metrics.tournamentsByStatus.completed} ${statusDetailLabel("completed")}`,
    },
    {
      label: t("playedMatches"),
      value: metrics.playedMatches,
      detail: t("completedNonByeMatches"),
    },
  ];

  return (
    <section aria-label={t("dashboardOverview")}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            key={card.label}
          >
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {card.value}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {card.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
