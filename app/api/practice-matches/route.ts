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

async function getSessionProfileId() {
  const session = await requirePlayerSession();

  return session?.user.playerProfileId ?? null;
}

async function validateReferencedProfiles(input: PracticeMatchInput) {
  const referencedIds = referencedPlayerProfileIds(input);

  if (referencedIds.length === 0) {
    return false;
  }

  const existingCount = await PlayerProfile.countDocuments({
    _id: { $in: referencedIds },
  });

  return existingCount === referencedIds.length;
}

export async function GET() {
  const playerProfileId = await getSessionProfileId();

  if (!playerProfileId) {
    return jsonError("Player account required", "UNAUTHORIZED", 401);
  }

  try {
    await connectDB();

    const practiceMatches = await PracticeMatch.find({
      $or: [
        { createdBy: playerProfileId },
        { "sideA.playerProfileId": playerProfileId },
        { "sideB.playerProfileId": playerProfileId },
      ],
    })
      .sort({ playedAt: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      practiceMatches: practiceMatches.map(serializePracticeMatch),
    });
  } catch {
    return jsonError(
      "Unable to load practice matches",
      "INTERNAL_ERROR",
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  const playerProfileId = await getSessionProfileId();

  if (!playerProfileId) {
    return jsonError("Player account required", "UNAUTHORIZED", 401);
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

    if (!(await validateReferencedProfiles(parsed.value))) {
      return jsonError("Unknown player profile", "VALIDATION_ERROR", 422);
    }

    const match = await PracticeMatch.create(parsed.value);

    return NextResponse.json(
      {
        match: serializePracticeMatch(match),
      },
      {
        status: 201,
      },
    );
  } catch {
    return jsonError(
      "Unable to create practice match",
      "INTERNAL_ERROR",
      500,
    );
  }
}
