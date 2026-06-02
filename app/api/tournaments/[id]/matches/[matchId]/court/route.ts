import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError } from "@/lib/api";
import { assignMatchToCourt } from "@/lib/bracket/scheduler";
import { connectDB } from "@/lib/db";
import { Tournament } from "@/lib/models/Tournament";

interface RouteContext {
  params: Promise<{
    id: string;
    matchId: string;
  }>;
}

function parseCourtNumber(body: unknown): number | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const { courtNumber } = body as Record<string, unknown>;

  return typeof courtNumber === "number" && Number.isInteger(courtNumber)
    ? courtNumber
    : null;
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

  const courtNumber = parseCourtNumber(body);

  if (courtNumber === null) {
    return jsonError("Invalid court number", "VALIDATION_ERROR", 422);
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

    let assignment;

    try {
      assignment = assignMatchToCourt(tournament, match, courtNumber);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Invalid court number"
      ) {
        return jsonError(error.message, "VALIDATION_ERROR", 422);
      }

      return jsonError(
        error instanceof Error
          ? error.message
          : "Unable to assign selected court",
        "CONFLICT",
        409,
      );
    }

    await tournament.save();

    return NextResponse.json({
      matchId: assignment.matchId,
      status: match.status,
      courtNumber: assignment.courtNumber,
      replacedMatchId: assignment.replacedMatchId,
    });
  } catch {
    return jsonError("Unable to assign selected court", "INTERNAL_ERROR", 500);
  }
}
