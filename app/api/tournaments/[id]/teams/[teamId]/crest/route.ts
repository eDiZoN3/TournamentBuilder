import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { normalizeCrest } from "@/lib/crest";
import { Tournament } from "@/lib/models/Tournament";

interface RouteContext {
  params: Promise<{
    id: string;
    teamId: string;
  }>;
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

  const crest = normalizeCrest(body);

  if (!crest) {
    return jsonError("Invalid crest", "VALIDATION_ERROR", 422);
  }

  const { id, teamId } = await context.params;

  if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(teamId)) {
    return jsonError("Team not found", "NOT_FOUND", 404);
  }

  try {
    await connectDB();

    const tournament = await Tournament.findById(id);
    const team = tournament?.teams.find(
      (candidate) => candidate._id.toString() === teamId,
    );

    if (!tournament || !team) {
      return jsonError("Team not found", "NOT_FOUND", 404);
    }

    team.crest = crest;

    await tournament.save();

    return NextResponse.json({ teamId: team._id.toString(), crest });
  } catch {
    return jsonError("Unable to update crest", "INTERNAL_ERROR", 500);
  }
}
