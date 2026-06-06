import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { Tournament, type ITeam } from "@/lib/models/Tournament";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface TeamInput {
  name: string;
  players: string[];
  seed: number;
}

interface UpdateBody {
  name?: string;
  teams?: TeamInput[];
}

interface DeleteBody {
  confirmationName?: string;
}

function isValidId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

function parseTeams(value: unknown): TeamInput[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const teams: TeamInput[] = [];

  for (const team of value) {
    if (!team || typeof team !== "object") {
      return null;
    }

    const { name, players, seed } = team as Record<string, unknown>;

    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.trim().length > 50 ||
      !Array.isArray(players) ||
      !players.every(
        (player) => typeof player === "string" && player.trim().length > 0,
      ) ||
      (seed !== undefined && !Number.isInteger(seed))
    ) {
      return null;
    }

    teams.push({
      name: name.trim(),
      players: players.map((player) => player.trim()),
      seed: (seed as number | undefined) ?? 0,
    });
  }

  return teams;
}

function parseUpdateBody(body: unknown): UpdateBody | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const entries = Object.entries(body);

  if (
    entries.length === 0 ||
    entries.some(([key]) => !["name", "teams"].includes(key))
  ) {
    return null;
  }

  const { name, teams } = body as Record<string, unknown>;
  const update: UpdateBody = {};

  if (name !== undefined) {
    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.trim().length > 100
    ) {
      return null;
    }

    update.name = name.trim();
  }

  if (teams !== undefined) {
    const parsedTeams = parseTeams(teams);

    if (!parsedTeams) {
      return null;
    }

    update.teams = parsedTeams;
  }

  return update;
}

async function parseDeleteBody(request: NextRequest): Promise<DeleteBody> {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return {};
    }

    const { confirmationName } = body as Record<string, unknown>;

    return typeof confirmationName === "string" ? { confirmationName } : {};
  } catch {
    return {};
  }
}

async function findTournament(id: string) {
  if (!isValidId(id)) {
    return null;
  }

  await connectDB();

  return Tournament.findById(id);
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const tournament = await findTournament(id);

    if (!tournament) {
      return jsonError("Tournament not found", "NOT_FOUND", 404);
    }

    const responseBody = tournament.toObject();

    responseBody.format ??= "double_elimination";
    responseBody.roundRobinMatchFormat ??= "bo1";

    return NextResponse.json(responseBody);
  } catch {
    return jsonError("Unable to load tournament", "INTERNAL_ERROR", 500);
  }
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

  const update = parseUpdateBody(body);

  if (!update) {
    return jsonError("Invalid tournament update", "VALIDATION_ERROR", 422);
  }

  const { id } = await context.params;

  try {
    const tournament = await findTournament(id);

    if (!tournament) {
      return jsonError("Tournament not found", "NOT_FOUND", 404);
    }

    if (update.teams && tournament.status !== "draft") {
      return jsonError(
        "Teams cannot be changed after a tournament has started",
        "CONFLICT",
        409,
      );
    }

    if (update.name) {
      tournament.name = update.name;
    }

    if (update.teams) {
      tournament.teams = update.teams as ITeam[];
    }

    await tournament.save();

    const responseBody = tournament.toObject();

    responseBody.format ??= "double_elimination";
    responseBody.roundRobinMatchFormat ??= "bo1";

    return NextResponse.json(responseBody);
  } catch {
    return jsonError("Unable to update tournament", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  const { id } = await context.params;

  try {
    const tournament = await findTournament(id);

    if (!tournament) {
      return jsonError("Tournament not found", "NOT_FOUND", 404);
    }

    if (tournament.status !== "draft") {
      const { confirmationName } = await parseDeleteBody(request);

      if (confirmationName !== tournament.name) {
        return jsonError(
          "Type the tournament name to delete it",
          "CONFLICT",
          409,
        );
      }
    }

    if (tournament.status === "draft") {
      await tournament.deleteOne();

      return new NextResponse(null, {
        status: 204,
      });
    }

    if (tournament.status !== "active" && tournament.status !== "completed") {
      return jsonError(
        "Tournament cannot be deleted",
        "CONFLICT",
        409,
      );
    }

    await tournament.deleteOne();

    return new NextResponse(null, {
      status: 204,
    });
  } catch {
    return jsonError("Unable to delete tournament", "INTERNAL_ERROR", 500);
  }
}
