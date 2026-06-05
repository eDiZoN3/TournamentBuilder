import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { StatsReset } from "@/lib/models/StatsReset";
import { Tournament, type ITournament } from "@/lib/models/Tournament";
import { aggregateStats, type StatsResetRule } from "@/lib/stats";

export async function GET() {
  try {
    await connectDB();

    const [tournaments, resetRules] = await Promise.all([
      Tournament.find().lean(),
      StatsReset.find().lean(),
    ]);

    return NextResponse.json(
      aggregateStats(
        JSON.parse(JSON.stringify(tournaments)) as ITournament[],
        JSON.parse(JSON.stringify(resetRules)) as StatsResetRule[],
      ),
    );
  } catch {
    return jsonError("Unable to load stats", "INTERNAL_ERROR", 500);
  }
}
