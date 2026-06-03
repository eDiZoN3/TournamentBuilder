import type { AdminDashboardMetrics } from "@/lib/admin/dashboardMetrics";

interface DashboardMetricsProps {
  metrics: AdminDashboardMetrics;
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const cards = [
    {
      label: "Registered players",
      value: metrics.registeredPlayers,
      detail: "Player accounts",
    },
    {
      label: "Registered admins",
      value: metrics.registeredAdmins,
      detail: "Admin accounts",
    },
    {
      label: "Registered tournaments",
      value: metrics.registeredTournaments,
      detail: `${metrics.tournamentsByStatus.draft} draft / ${metrics.tournamentsByStatus.active} active / ${metrics.tournamentsByStatus.completed} completed`,
    },
    {
      label: "Played matches",
      value: metrics.playedMatches,
      detail: "Completed non-bye matches",
    },
  ];

  return (
    <section aria-label="Dashboard overview">
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
