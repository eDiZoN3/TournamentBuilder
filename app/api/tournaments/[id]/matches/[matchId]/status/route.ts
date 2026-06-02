import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError } from "@/lib/api";
import { assignCourt, onMatchComplete } from "@/lib/bracket/advance";
import { connectDB } from "@/lib/db";
import { Tournament } from "@/lib/models/Tournament";

interface RouteContext {
  params: Promise<{
    id: string;
    matchId: string;
  }>;
}

type RequestedStatus = "in_progress" | "completed";

function parseStatus(body: unknown): RequestedStatus | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const { status } = body as Record<string, unknown>;

  return status === "in_progress" || status === "completed" ? status : null;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
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

  const requestedStatus = parseStatus(body);

  if (!requestedStatus) {
    return jsonError("Invalid match status", "VALIDATION_ERROR", 422);
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

    let tournamentCompleted = false;
    let nextMatchesReady: string[] = [];

    if (requestedStatus === "in_progress") {
      try {
        assignCourt(tournament, match);
      } catch (error) {
        return jsonError(
          errorMessage(error, "Unable to assign court"),
          "CONFLICT",
          409,
        );
      }
    } else {
      if (match.status !== "in_progress") {
        return jsonError(
          "Only in-progress matches can be completed",
          "CONFLICT",
          409,
        );
      }

      if (!match.teamA || !match.teamB) {
        return jsonError(
          "Both teams are required to complete a match",
          "VALIDATION_ERROR",
          422,
        );
      }

      try {
        const completion = onMatchComplete(tournament, match);

        tournamentCompleted = completion.tournamentCompleted;
        nextMatchesReady = completion.nextMatchesReady;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Match winner has not been determined"
        ) {
          return jsonError(error.message, "VALIDATION_ERROR", 422);
        }

        throw error;
      }
    }

    await tournament.save();

    return NextResponse.json({
      matchId: match._id.toString(),
      status: match.status,
      courtNumber: match.courtNumber,
      winnerId: match.winnerId?.toString() ?? null,
      loserId: match.loserId?.toString() ?? null,
      tournamentCompleted,
      nextMatchesReady,
    });
  } catch {
    return jsonError("Unable to update match status", "INTERNAL_ERROR", 500);
  }
}
