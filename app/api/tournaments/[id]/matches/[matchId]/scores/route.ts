import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Tournament } from "@/lib/models/Tournament";
import {
  determineMatchWinner,
  determineSetWinner,
  replaceSet,
  validateSet,
} from "@/lib/scoring";

interface RouteContext {
  params: Promise<{
    id: string;
    matchId: string;
  }>;
}

interface ScoreBody {
  setIndex: number;
  scoreA: number;
  scoreB: number;
}

function parseScoreBody(body: unknown): ScoreBody | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const { setIndex, scoreA, scoreB } = body as Record<string, unknown>;

  if (
    !Number.isInteger(setIndex) ||
    typeof scoreA !== "number" ||
    typeof scoreB !== "number"
  ) {
    return null;
  }

  return {
    setIndex: setIndex as number,
    scoreA,
    scoreB,
  };
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", "VALIDATION_ERROR", 422);
  }

  const score = parseScoreBody(body);

  if (!score) {
    return jsonError("Invalid score details", "VALIDATION_ERROR", 422);
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

    if (match.status !== "in_progress") {
      return jsonError(
        "Scores can only be entered for in-progress matches",
        "CONFLICT",
        409,
      );
    }

    if (!match.teamA || !match.teamB) {
      return jsonError("Both teams are required", "CONFLICT", 409);
    }

    const maxSetIndex = match.format === "bo1" ? 0 : 2;

    if (
      score.setIndex < 0 ||
      score.setIndex > maxSetIndex ||
      score.setIndex > match.teamA.sets.length
    ) {
      return jsonError("Invalid set index", "VALIDATION_ERROR", 422);
    }

    const validation = validateSet(score.scoreA, score.scoreB);

    if (!validation.valid) {
      return jsonError(validation.error, "VALIDATION_ERROR", 422);
    }

    const replacement = replaceSet(match.teamA.sets, score.setIndex, {
      scoreA: score.scoreA,
      scoreB: score.scoreB,
      pointsToWin: validation.pointsToWin,
    });

    match.teamA.sets = replacement.sets;

    await tournament.save();

    return NextResponse.json({
      setIndex: score.setIndex,
      pointsToWin: validation.pointsToWin,
      setWinner: determineSetWinner(score.scoreA, score.scoreB),
      sets: replacement.sets,
      matchWinner: determineMatchWinner(replacement.sets, match.format),
      clearedSets: replacement.clearedSets,
    });
  } catch {
    return jsonError("Unable to save score", "INTERNAL_ERROR", 500);
  }
}
