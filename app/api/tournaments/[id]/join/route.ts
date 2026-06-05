import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requirePlayerSession } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { Tournament } from "@/lib/models/Tournament";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function joinedPlayerSummary(player: {
  joinedAt?: Date | string;
  playerProfileId?: { toString(): string };
  displayName: string;
  email: string;
  firstName: string;
  surname?: string | null;
  userId?: { toString(): string };
}) {
  return {
    userId: player.userId?.toString(),
    playerProfileId: player.playerProfileId?.toString(),
    firstName: player.firstName,
    surname: player.surname ?? undefined,
    displayName: player.displayName,
    email: player.email,
    joinedAt:
      player.joinedAt instanceof Date
        ? player.joinedAt.toISOString()
        : player.joinedAt,
  };
}

export async function POST(_request: NextRequest, context: RouteContext) {
  const session = await requirePlayerSession();

  if (!session) {
    return jsonError("Player account required", "UNAUTHORIZED", 401);
  }

  const { id } = await context.params;

  if (!Types.ObjectId.isValid(id)) {
    return jsonError("Tournament not found", "NOT_FOUND", 404);
  }

  try {
    await connectDB();

    const [profile, tournament] = await Promise.all([
      PlayerProfile.findOne({ userId: session.user.id }),
      Tournament.findById(id),
    ]);

    if (!profile) {
      return jsonError("Player profile not found", "NOT_FOUND", 404);
    }

    if (!tournament) {
      return jsonError("Tournament not found", "NOT_FOUND", 404);
    }

    if (
      !tournament.allowSelfJoin ||
      tournament.inputMode !== "players" ||
      tournament.status !== "draft"
    ) {
      return jsonError("Tournament is not open for player joins", "CONFLICT", 409);
    }

    const alreadyJoined = tournament.joinedPlayers.some(
      (player) => player.userId.toString() === profile.userId.toString(),
    );

    if (alreadyJoined) {
      return jsonError("Player already joined this tournament", "CONFLICT", 409);
    }

    tournament.joinedPlayers.push({
      userId: profile.userId,
      playerProfileId: profile._id,
      firstName: profile.firstName,
      surname: profile.surname ?? undefined,
      displayName: profile.displayName,
      email: profile.email,
      joinedAt: new Date(),
    });

    await tournament.save();

    const joinedPlayers = tournament.joinedPlayers.map(joinedPlayerSummary);

    return NextResponse.json({
      joined: true,
      player: joinedPlayerSummary(profile),
      joinedPlayerCount: joinedPlayers.length,
      joinedPlayers,
    });
  } catch {
    return jsonError("Unable to join tournament", "INTERNAL_ERROR", 500);
  }
}
