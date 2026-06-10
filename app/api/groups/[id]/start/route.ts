import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { TournamentGroup } from "@/lib/models/TournamentGroup";
import { generateBracket } from "@/lib/bracket/generate";
import { computeNextMatches } from "@/lib/groups/scheduler";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, ctx: RouteContext) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  const { id } = await ctx.params;

  if (!Types.ObjectId.isValid(id)) {
    return jsonError("Group not found", "NOT_FOUND", 404);
  }

  try {
    await connectDB();

    const group = await TournamentGroup.findById(id);

    if (!group) {
      return jsonError("Group not found", "NOT_FOUND", 404);
    }

    if (group.status !== "draft") {
      return jsonError("Group is not in draft status", "CONFLICT", 409);
    }

    if (group.teams.length < 2) {
      return jsonError(
        "At least 2 teams are required to start a group",
        "VALIDATION_ERROR",
        400,
      );
    }

    if (group.categories.length === 0) {
      return jsonError(
        "At least 1 category is required to start a group",
        "VALIDATION_ERROR",
        400,
      );
    }

    // Generate brackets for each category in position order
    const sortedCategories = [...group.categories].sort(
      (a, b) => a.position - b.position,
    );

    for (const cat of sortedCategories) {
      const catDoc = group.categories.find(
        (c) => c._id.toString() === cat._id.toString(),
      )!;
      catDoc.matches = generateBracket(group.teams as Parameters<typeof generateBracket>[0], 1, {
        knockoutBracketType: "single_elimination",
      }) as typeof catDoc.matches;
    }

    group.status = "active";

    // Run initial auto-schedule
    const activations = computeNextMatches(group.toObject() as Parameters<typeof computeNextMatches>[0]);

    for (const { categoryIndex, matchId } of activations) {
      const cat = group.categories[categoryIndex];
      const match = cat.matches.find((m) => m._id.toString() === matchId);

      if (match) {
        match.status = "in_progress";
        cat.currentMatchId = match._id;
      }
    }

    await group.save();

    return NextResponse.json(group.toObject());
  } catch (err) {
    return jsonError("Unable to start group", "INTERNAL_ERROR", 500);
  }
}
