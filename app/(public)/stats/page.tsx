import { StatsTable } from "@/components/stats/StatsTable";
import { LocalizedText } from "@/components/ui/LocalizedText";
import { connectDB } from "@/lib/db";
import { PracticeMatch } from "@/lib/models/PracticeMatch";
import { StatsReset } from "@/lib/models/StatsReset";
import { Tournament, type ITournament } from "@/lib/models/Tournament";
import { aggregatePracticeStats } from "@/lib/practiceStats";
import { aggregateStats, type StatsResetRule } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  await connectDB();

  const [tournaments, practiceMatches, resetRules] = await Promise.all([
    Tournament.find().lean(),
    PracticeMatch.find().lean(),
    StatsReset.find().lean(),
  ]);
  const serializedResetRules = JSON.parse(
    JSON.stringify(resetRules),
  ) as StatsResetRule[];
  const stats = aggregateStats(
    JSON.parse(JSON.stringify(tournaments)) as ITournament[],
    serializedResetRules,
  );
  const practiceStats = aggregatePracticeStats(
    JSON.parse(JSON.stringify(practiceMatches)),
    serializedResetRules,
  );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          <LocalizedText k="globalStats" />
        </h1>
      </header>
      <div className="grid gap-6 xl:grid-cols-2">
        <StatsTable
          emptyTitle=""
          emptyTitleKey="noTeamStats"
          rows={stats.teams}
          title=""
          titleKey="teamStats"
        />
        <StatsTable
          emptyTitle=""
          emptyTitleKey="noPlayerStats"
          rows={stats.players}
          title=""
          titleKey="playerStats"
        />
        <StatsTable
          emptyTitle=""
          emptyTitleKey="noPracticeStats"
          rows={practiceStats}
          title=""
          titleKey="practicePlayerStats"
        />
      </div>
    </section>
  );
}
