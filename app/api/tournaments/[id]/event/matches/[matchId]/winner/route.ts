import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { toggleEventMatchWinner } from "@/lib/eventTournament";
import { Tournament } from "@/lib/models/Tournament";

interface RouteContext {
  params: Promise<{
    id: string;
    matchId: string;
  }>;
}

function parseBody(body: unknown): { winnerId: string } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const { winnerId } = body as Record<string, unknown>;

  if (typeof winnerId !== "string" || !Types.ObjectId.isValid(winnerId)) {
    return null;
  }

  return { winnerId };
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

  const parsedBody = parseBody(body);

  if (!parsedBody) {
    return jsonError("Invalid winner", "VALIDATION_ERROR", 422);
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

    if ((tournament.format ?? "double_elimination") !== "event") {
      return jsonError("Tournament is not an event tournament", "CONFLICT", 409);
    }

    try {
      const result = toggleEventMatchWinner(
        tournament,
        match,
        parsedBody.winnerId,
      );

      await tournament.save();

      return NextResponse.json({
        matchId: match._id.toString(),
        status: match.status,
        winnerId: result.winnerId,
        loserId: result.loserId,
        selected: result.selected,
        affectedMatchIds: result.affectedMatchIds,
        nextMatchesReady: result.nextMatchesReady,
        tournamentCompleted: result.tournamentCompleted,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        [
          "Both participants are required",
          "Winner must be one of the match participants",
        ].includes(error.message)
      ) {
        return jsonError(error.message, "VALIDATION_ERROR", 422);
      }

      throw error;
    }
  } catch {
    return jsonError("Unable to update event match", "INTERNAL_ERROR", 500);
  }
}
