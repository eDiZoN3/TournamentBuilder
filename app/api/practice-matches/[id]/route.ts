import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requirePlayerSession } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { PracticeMatch } from "@/lib/models/PracticeMatch";
import {
  parsePracticeMatchPayload,
  referencedPlayerProfileIds,
  serializePracticeMatch,
  type PracticeMatchInput,
} from "@/lib/practiceMatches";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

async function getSessionProfileId() {
  const session = await requirePlayerSession();

  return session?.user.playerProfileId ?? null;
}

async function validateReferencedProfiles(input: PracticeMatchInput) {
  const referencedIds = referencedPlayerProfileIds(input);
  const existingCount = await PlayerProfile.countDocuments({
    _id: { $in: referencedIds },
  });

  return existingCount === referencedIds.length;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const playerProfileId = await getSessionProfileId();

  if (!playerProfileId) {
    return jsonError("Player account required", "UNAUTHORIZED", 401);
  }

  const { id } = await context.params;

  if (!Types.ObjectId.isValid(id)) {
    return jsonError("Practice match not found", "NOT_FOUND", 404);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", "VALIDATION_ERROR", 422);
  }

  const parsed = parsePracticeMatchPayload(body, playerProfileId);

  if (!parsed.ok) {
    return jsonError(parsed.error, "VALIDATION_ERROR", 422);
  }

  try {
    await connectDB();

    const match = await PracticeMatch.findById(id);

    if (!match) {
      return jsonError("Practice match not found", "NOT_FOUND", 404);
    }

    if (match.createdBy.toString() !== playerProfileId) {
      return jsonError("Cannot edit another player's practice match", "FORBIDDEN", 403);
    }

    if (!(await validateReferencedProfiles(parsed.value))) {
      return jsonError("Unknown player profile", "VALIDATION_ERROR", 422);
    }

    match.set({
      playedAt: parsed.value.playedAt,
      sideA: parsed.value.sideA,
      sideB: parsed.value.sideB,
      sets: parsed.value.sets,
      winnerSide: parsed.value.winnerSide,
    });

    await match.save();

    return NextResponse.json({
      match: serializePracticeMatch(match),
    });
  } catch {
    return jsonError(
      "Unable to update practice match",
      "INTERNAL_ERROR",
      500,
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const playerProfileId = await getSessionProfileId();

  if (!playerProfileId) {
    return jsonError("Player account required", "UNAUTHORIZED", 401);
  }

  const { id } = await context.params;

  if (!Types.ObjectId.isValid(id)) {
    return jsonError("Practice match not found", "NOT_FOUND", 404);
  }

  try {
    await connectDB();

    const match = await PracticeMatch.findById(id);

    if (!match) {
      return jsonError("Practice match not found", "NOT_FOUND", 404);
    }

    if (match.createdBy.toString() !== playerProfileId) {
      return jsonError(
        "Cannot delete another player's practice match",
        "FORBIDDEN",
        403,
      );
    }

    await match.deleteOne();

    return NextResponse.json({
      deleted: true,
    });
  } catch {
    return jsonError(
      "Unable to delete practice match",
      "INTERNAL_ERROR",
      500,
    );
  }
}
