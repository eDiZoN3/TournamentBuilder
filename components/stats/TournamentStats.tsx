import { StatsTable } from "@/components/stats/StatsTable";
import type { ITournament } from "@/lib/models/Tournament";
import { calculateTournamentStats, type StatsResult } from "@/lib/stats";

interface TournamentStatsProps {
  stats?: StatsResult;
  tournament?: ITournament;
}

export function TournamentStats({
  stats,
  tournament,
}: TournamentStatsProps) {
  const resolvedStats =
    stats ?? (tournament ? calculateTournamentStats(tournament) : null);

  if (!resolvedStats) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Stats
        </h2>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <StatsTable
          emptyTitle="No team stats yet"
          rows={resolvedStats.teams}
          title="Team stats"
        />
        <StatsTable
          emptyTitle="No player stats yet"
          rows={resolvedStats.players}
          title="Player stats"
        />
      </div>
    </section>
  );
}
