import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { TournamentGroup } from "@/lib/models/TournamentGroup";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface TeamInput {
  name: string;
  players: string[];
}

function parseTeams(value: unknown): TeamInput[] | null {
  if (!Array.isArray(value) || value.length < 2) return null;

  const teams: TeamInput[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") return null;

    const { name, players } = item as Record<string, unknown>;

    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      !Array.isArray(players)
    ) {
      return null;
    }

    teams.push({
      name: name.trim(),
      players: (players as unknown[]).map((p) =>
        typeof p === "string" ? p.trim() : String(p),
      ),
    });
  }

  return teams;
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  const { id } = await ctx.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", "VALIDATION_ERROR", 400);
  }

  const { teams: teamsRaw } = (body as Record<string, unknown>) ?? {};
  const teams = parseTeams(teamsRaw);

  if (!teams) {
    return jsonError(
      "At least 2 valid teams are required",
      "VALIDATION_ERROR",
      400,
    );
  }

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
      return jsonError(
        "Cannot change teams on a non-draft group",
        "CONFLICT",
        409,
      );
    }

    group.teams = teams.map((t, index) => ({
      _id: new Types.ObjectId(),
      name: t.name,
      players: t.players,
      seed: index + 1,
    }));

    await group.save();

    return NextResponse.json(group.toObject());
  } catch {
    return jsonError("Unable to update teams", "INTERNAL_ERROR", 500);
  }
}
