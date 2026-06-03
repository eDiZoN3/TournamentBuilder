import { StatsTable } from "@/components/stats/StatsTable";
import { LocalizedText } from "@/components/ui/LocalizedText";
import { connectDB } from "@/lib/db";
import { Tournament, type ITournament } from "@/lib/models/Tournament";
import { aggregateStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  await connectDB();

  const tournaments = await Tournament.find().lean();
  const stats = aggregateStats(
    JSON.parse(JSON.stringify(tournaments)) as ITournament[],
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
          emptyTitle="No team stats yet"
          rows={stats.teams}
          title="Team stats"
        />
        <StatsTable
          emptyTitle="No player stats yet"
          rows={stats.players}
          title="Player stats"
        />
      </div>
    </section>
  );
}
