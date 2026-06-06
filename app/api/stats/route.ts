import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { PracticeMatch } from "@/lib/models/PracticeMatch";
import { StatsReset } from "@/lib/models/StatsReset";
import { Tournament, type ITournament } from "@/lib/models/Tournament";
import { aggregatePracticeStats } from "@/lib/practiceStats";
import { aggregateStats, type StatsResetRule } from "@/lib/stats";

export async function GET() {
  try {
    await connectDB();

    const [tournaments, practiceMatches, resetRules] = await Promise.all([
      Tournament.find().lean(),
      PracticeMatch.find().lean(),
      StatsReset.find().lean(),
    ]);
    const serializedResetRules = JSON.parse(
      JSON.stringify(resetRules),
    ) as StatsResetRule[];

    return NextResponse.json(
      {
        ...aggregateStats(
          JSON.parse(JSON.stringify(tournaments)) as ITournament[],
          serializedResetRules,
        ),
        practicePlayers: aggregatePracticeStats(
          JSON.parse(JSON.stringify(practiceMatches)),
          serializedResetRules,
        ),
      },
    );
  } catch {
    return jsonError("Unable to load stats", "INTERNAL_ERROR", 500);
  }
}
