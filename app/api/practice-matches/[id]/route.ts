import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requirePlayerSession } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { PracticeMatch } from "@/lib/models/PracticeMatch";
import { playerProfileMapById } from "@/lib/playerProfiles";
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

async function resolvePracticeParticipants(
  input: PracticeMatchInput,
): Promise<PracticeMatchInput | null> {
  const referencedIds = referencedPlayerProfileIds(input);
  const profilesById = await playerProfileMapById(referencedIds);

  if (referencedIds.length === 0 || profilesById.size !== referencedIds.length) {
    return null;
  }

  const resolveSide = (side: PracticeMatchInput["sideA"]) =>
    side.map((participant) => {
      const playerProfileId = participant.playerProfileId!.toString();
      const profile = profilesById.get(playerProfileId)!;

      return {
        playerProfileId: participant.playerProfileId,
        displayName: profile.displayName,
      };
    });

  return {
    ...input,
    sideA: resolveSide(input.sideA),
    sideB: resolveSide(input.sideB),
  };
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

    const resolvedInput = await resolvePracticeParticipants(parsed.value);

    if (!resolvedInput) {
      return jsonError("Unknown player profile", "VALIDATION_ERROR", 422);
    }

    match.set({
      playedAt: resolvedInput.playedAt,
      sideA: resolvedInput.sideA,
      sideB: resolvedInput.sideB,
      sets: resolvedInput.sets,
      winnerSide: resolvedInput.winnerSide,
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
