"use client";

import { StatsTable } from "@/components/stats/StatsTable";
import type { ITournament } from "@/lib/models/Tournament";
import { calculateTournamentStats, type StatsResult } from "@/lib/stats";
import { useLocale } from "@/components/ui/LocaleProvider";

interface TournamentStatsProps {
  stats?: StatsResult;
  tournament?: ITournament;
}

export function TournamentStats({
  stats,
  tournament,
}: TournamentStatsProps) {
  const { t } = useLocale();
  const resolvedStats =
    stats ?? (tournament ? calculateTournamentStats(tournament) : null);

  if (!resolvedStats) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("stats")}
        </h2>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <StatsTable
          emptyTitle=""
          emptyTitleKey="noTeamStats"
          rows={resolvedStats.teams}
          title=""
          titleKey="teamStats"
        />
        <StatsTable
          emptyTitle=""
          emptyTitleKey="noPlayerStats"
          rows={resolvedStats.players}
          title=""
          titleKey="playerStats"
        />
      </div>
    </section>
  );
}
