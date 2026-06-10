import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { TournamentGroup } from "@/lib/models/TournamentGroup";
import {
  replaceSet,
  validateSet,
} from "@/lib/scoring";

interface RouteContext {
  params: Promise<{ id: string; catId: string; matchId: string }>;
}

interface ScoreBody {
  setIndex: number;
  scoreA: number;
  scoreB: number;
}

function parseScoreBody(body: unknown): ScoreBody | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const { setIndex, scoreA, scoreB } = body as Record<string, unknown>;

  if (
    !Number.isInteger(setIndex) ||
    typeof scoreA !== "number" ||
    typeof scoreB !== "number"
  ) {
    return null;
  }

  return { setIndex: setIndex as number, scoreA, scoreB };
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
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

    match.teamA.sets = replacement.sets as typeof match.teamA.sets;

    await group.save();

    return NextResponse.json(group.toObject());
  } catch {
    return jsonError("Unable to save score", "INTERNAL_ERROR", 500);
  }
}
