import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { TournamentGroup } from "@/lib/models/TournamentGroup";
import type { ITournamentGroup, IGroupCategory } from "@/lib/models/TournamentGroup";
import { onMatchComplete } from "@/lib/bracket/advance";
import type { ITournament } from "@/lib/models/Tournament";
import { computeNextMatches } from "@/lib/groups/scheduler";

interface RouteContext {
  params: Promise<{ id: string; catId: string; matchId: string }>;
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

  const { status: requestedStatus } = (body as Record<string, unknown>) ?? {};

  if (requestedStatus !== "completed") {
    return jsonError("Only 'completed' status is supported", "VALIDATION_ERROR", 422);
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
        "Only in-progress matches can be completed",
        "CONFLICT",
        409,
      );
    }

    // Use advance.ts via a bridge tournament object that shares the category's match references
    const bridge = bridgeTournament(cat);

    try {
      onMatchComplete(bridge, match as ITournament["matches"][number]);
    } catch (err) {
      if (err instanceof Error) {
        return jsonError(err.message, "VALIDATION_ERROR", 422);
      }
      throw err;
    }

    // Run auto-scheduler across all categories
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

    // Check if the entire group is now complete
    if (isGroupComplete(group.toObject() as ITournamentGroup)) {
      group.status = "completed";
    }

    await group.save();

    return NextResponse.json(group.toObject());
  } catch {
    return jsonError("Unable to update match status", "INTERNAL_ERROR", 500);
  }
}
