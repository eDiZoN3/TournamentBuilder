import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError } from "@/lib/api";
import { onMatchComplete } from "@/lib/bracket/advance";
import { rollbackCompletedMatch } from "@/lib/bracket/rollback";
import { connectDB } from "@/lib/db";
import { Tournament, type ISetScore } from "@/lib/models/Tournament";
import { determineMatchWinner, validateSet } from "@/lib/scoring";

interface RouteContext {
  params: Promise<{
    id: string;
    matchId: string;
  }>;
}

interface RawSetScore {
  scoreA: number;
  scoreB: number;
}

type ParsedSets =
  | {
      valid: true;
      sets: ISetScore[];
      matchWinner: "A" | "B";
    }
  | {
      valid: false;
      error: string;
    };

function parseBody(body: unknown): RawSetScore[] | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const { sets } = body as Record<string, unknown>;

  if (!Array.isArray(sets) || sets.length === 0) {
    return null;
  }

  const parsedSets: RawSetScore[] = [];

  for (const set of sets) {
    if (!set || typeof set !== "object" || Array.isArray(set)) {
      return null;
    }

    const { scoreA, scoreB } = set as Record<string, unknown>;

    if (typeof scoreA !== "number" || typeof scoreB !== "number") {
      return null;
    }

    parsedSets.push({ scoreA, scoreB });
  }

  return parsedSets;
}

function validateSets(
  rawSets: RawSetScore[],
  format: "bo1" | "bo3",
): ParsedSets {
  const maxSets = format === "bo1" ? 1 : 3;

  if (rawSets.length > maxSets) {
    return {
      valid: false,
      error: "Too many sets for match format",
    };
  }

  const sets: ISetScore[] = [];

  for (const set of rawSets) {
    const validation = validateSet(set.scoreA, set.scoreB);

    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error,
      };
    }

    sets.push({
      scoreA: set.scoreA,
      scoreB: set.scoreB,
      pointsToWin: validation.pointsToWin,
    });
  }

  const matchWinner = determineMatchWinner(sets, format);

  if (!matchWinner) {
    return {
      valid: false,
      error: "Match winner has not been determined",
    };
  }

  return {
    valid: true,
    sets,
    matchWinner,
  };
}

function idsEqual(
  first: Types.ObjectId | string,
  second: Types.ObjectId | string,
): boolean {
  return first.toString() === second.toString();
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", "VALIDATION_ERROR", 422);
  }

  const rawSets = parseBody(body);

  if (!rawSets) {
    return jsonError("Invalid override details", "VALIDATION_ERROR", 422);
  }

  const { id, matchId } = await context.params;

  if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(matchId)) {
    return jsonError("Match not found", "NOT_FOUND", 404);
  }

  try {
    await connectDB();

    const tournament = await Tournament.findById(id);
    const match = tournament?.matches.find(
      (candidate) => candidate._id.toString() === matchId,
    );

    if (!tournament || !match) {
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
      return jsonError(
        "Completed match is missing team data",
        "CONFLICT",
        409,
      );
    }

    const validation = validateSets(rawSets, match.format);

    if (!validation.valid) {
      return jsonError(validation.error, "VALIDATION_ERROR", 422);
    }

    const correctedWinnerId =
      validation.matchWinner === "A" ? match.teamA.teamId : match.teamB.teamId;
    const winnerChanged = !idsEqual(match.winnerId, correctedWinnerId);
    let affectedMatchIds: string[] = [];

    if (winnerChanged) {
      const rollback = rollbackCompletedMatch(tournament, match);

      affectedMatchIds = rollback.affectedMatchIds;
      match.winnerId = null;
      match.loserId = null;
      match.status = "in_progress";
      match.courtNumber = null;
    }

    match.teamA.sets = validation.sets;
    match.teamB.sets = [];

    if (winnerChanged) {
      onMatchComplete(tournament, match);
    }

    await tournament.save();

    return NextResponse.json({
      matchId: match._id.toString(),
      winnerChanged,
      affectedMatchIds,
      tournamentStatus: tournament.status,
    });
  } catch {
    return jsonError("Unable to override match", "INTERNAL_ERROR", 500);
  }
}
