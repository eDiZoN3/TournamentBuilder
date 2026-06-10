import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { TournamentGroup } from "@/lib/models/TournamentGroup";
import type { IGroupCategory, ITournamentGroup } from "@/lib/models/TournamentGroup";
import { onMatchComplete } from "@/lib/bracket/advance";
import { rollbackCompletedMatch } from "@/lib/bracket/rollback";
import type { ITournament, ISetScore } from "@/lib/models/Tournament";
import { computeNextMatches } from "@/lib/groups/scheduler";
import { determineMatchWinner, validateSet } from "@/lib/scoring";

interface RouteContext {
  params: Promise<{ id: string; catId: string; matchId: string }>;
}

interface RawSet {
  scoreA: number;
  scoreB: number;
}

function parseSets(body: unknown): RawSet[] | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const { sets } = body as Record<string, unknown>;

  if (!Array.isArray(sets) || sets.length === 0) return null;

  const result: RawSet[] = [];

  for (const item of sets) {
    if (!item || typeof item !== "object") return null;

    const { scoreA, scoreB } = item as Record<string, unknown>;

    if (typeof scoreA !== "number" || typeof scoreB !== "number") return null;

    result.push({ scoreA, scoreB });
  }

  return result;
}

function bridgeTournament(cat: IGroupCategory): ITournament {
  return {
    _id: cat._id,
    name: "",
    status: "active",
    format: "double_elimination",
    knockoutBracketType: "single_elimination",
    firstRoundPairingMode: "random",
    matchResultMode: "points",
    knockoutMatchFormat: "bo1",
    roundRobinMatchFormat: "bo1",
    teamSize: 2,
    courtsAvailable: 1,
    inputMode: "teams",
    allowSelfJoin: false,
    teams: [],
    joinedPlayers: [],
    matches: cat.matches as ITournament["matches"],
    currentMatchIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as ITournament;
}

function isGroupComplete(group: ITournamentGroup): boolean {
  return group.categories.every((cat) =>
    cat.matches.every((m) => m.isBye || m.status === "completed"),
  );
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", "VALIDATION_ERROR", 422);
  }

  const rawSets = parseSets(body);

  if (!rawSets) {
    return jsonError("Invalid override details", "VALIDATION_ERROR", 422);
  }

  const { id, catId, matchId } = await ctx.params;

  if (
    !Types.ObjectId.isValid(id) ||
    !Types.ObjectId.isValid(catId) ||
    !Types.ObjectId.isValid(matchId)
  ) {
    return jsonError("Match not found", "NOT_FOUND", 404);
  }

  try {
    await connectDB();

    const group = await TournamentGroup.findById(id);
    const cat = group?.categories.find((c) => c._id.toString() === catId);
    const match = cat?.matches.find((m) => m._id.toString() === matchId);

    if (!group || !cat || !match) {
      return jsonError("Match not found", "NOT_FOUND", 404);
    }

    if (match.status !== "completed" || match.isBye) {
      return jsonError(
        "Only completed non-bye matches can be overridden",
        "CONFLICT",
        409,
      );
    }

    if (!match.teamA || !match.teamB || !match.winnerId) {
      return jsonError("Completed match is missing team data", "CONFLICT", 409);
    }

    // Validate and parse the corrected sets
    const maxSets = match.format === "bo1" ? 1 : 3;

    if (rawSets.length > maxSets) {
      return jsonError("Too many sets for match format", "VALIDATION_ERROR", 422);
    }

    const validatedSets: ISetScore[] = [];

    for (const s of rawSets) {
      const v = validateSet(s.scoreA, s.scoreB);

      if (!v.valid) {
        return jsonError(v.error, "VALIDATION_ERROR", 422);
      }

      validatedSets.push({ scoreA: s.scoreA, scoreB: s.scoreB, pointsToWin: v.pointsToWin });
    }

    const matchWinner = determineMatchWinner(validatedSets, match.format);

    if (!matchWinner) {
      return jsonError("Match winner has not been determined", "VALIDATION_ERROR", 422);
    }

    const correctedWinnerId =
      matchWinner === "A" ? match.teamA.teamId : match.teamB.teamId;
    const winnerChanged =
      match.winnerId.toString() !== correctedWinnerId.toString();

    const bridge = bridgeTournament(cat);

    if (winnerChanged) {
      rollbackCompletedMatch(bridge, match as ITournament["matches"][number]);

      match.winnerId = null;
      match.loserId = null;
      match.status = "in_progress";
      match.courtNumber = null;
    }

    match.teamA.sets = validatedSets as typeof match.teamA.sets;
    match.teamB.sets = [];

    if (winnerChanged) {
      onMatchComplete(bridge, match as ITournament["matches"][number]);
    }

    // Run auto-scheduler
    const activations = computeNextMatches(group.toObject() as ITournamentGroup);

    for (const { categoryIndex, matchId: nextMatchId } of activations) {
      const nextCat = group.categories[categoryIndex];
      const nextMatch = nextCat.matches.find(
        (m) => m._id.toString() === nextMatchId,
      );

      if (nextMatch) {
        nextMatch.status = "in_progress";
        nextCat.currentMatchId = nextMatch._id;
      }
    }

    if (isGroupComplete(group.toObject() as ITournamentGroup)) {
      group.status = "completed";
    }

    await group.save();

    return NextResponse.json(group.toObject());
  } catch (err) {
    if (err instanceof Error) {
      return jsonError(err.message, "VALIDATION_ERROR", 422);
    }

    return jsonError("Unable to override match", "INTERNAL_ERROR", 500);
  }
}
