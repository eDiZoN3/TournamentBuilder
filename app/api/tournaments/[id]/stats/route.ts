import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { StatsReset } from "@/lib/models/StatsReset";
import { Tournament, type ITournament } from "@/lib/models/Tournament";
import { calculateTournamentStats, type StatsResetRule } from "@/lib/stats";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!Types.ObjectId.isValid(id)) {
    return jsonError("Tournament not found", "NOT_FOUND", 404);
  }

  try {
    await connectDB();

    const [tournament, resetRules] = await Promise.all([
      Tournament.findById(id).lean(),
      StatsReset.find().lean(),
    ]);

    if (!tournament) {
      return jsonError("Tournament not found", "NOT_FOUND", 404);
    }

    return NextResponse.json(
      calculateTournamentStats(
        JSON.parse(JSON.stringify(tournament)) as ITournament,
        JSON.parse(JSON.stringify(resetRules)) as StatsResetRule[],
      ),
    );
  } catch {
    return jsonError("Unable to load tournament stats", "INTERNAL_ERROR", 500);
  }
}
