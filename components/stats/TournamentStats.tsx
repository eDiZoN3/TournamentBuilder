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

  // Event tournaments entered as teams only have team standings; entered as
  // players they keep both player and team statistics.
  const showPlayerStats = !(
    tournament?.format === "event" &&
    (tournament?.inputMode ?? "teams") === "teams"
  );
  // Winner-only tournaments record no sets or points, so drop the scoring
  // columns and show only win/loss standings.
  const showScoreStats = tournament
    ? tournament.matchResultMode !== "winner_only"
    : true;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("stats")}
        </h2>
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <StatsTable
          emptyTitle=""
          emptyTitleKey="noTeamStats"
          rows={resolvedStats.teams}
          showScoreStats={showScoreStats}
          title=""
          titleKey="teamStats"
        />
        {showPlayerStats ? (
          <StatsTable
            emptyTitle=""
            emptyTitleKey="noPlayerStats"
            rows={resolvedStats.players}
            showScoreStats={showScoreStats}
            title=""
            titleKey="playerStats"
          />
        ) : null}
      </div>
    </section>
  );
}
