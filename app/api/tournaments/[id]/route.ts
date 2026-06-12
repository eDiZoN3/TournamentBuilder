import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { defaultEventDisciplines } from "@/lib/eventTournament";
import {
  Tournament,
  type IJoinedPlayer,
  type ITeam,
  type ITournament,
} from "@/lib/models/Tournament";
import { playerProfileMapById } from "@/lib/playerProfiles";
import {
  DEFAULT_TOURNAMENT_THEME,
  isTournamentTheme,
} from "@/lib/tournamentTheme";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface TeamInput {
  name: string;
  players: string[];
  playerProfileIds?: Array<string | null>;
  seed: number;
}

interface UpdateBody {
  eventDisciplines?: string[];
  name?: string;
  teams?: TeamInput[];
  theme?: string;
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

    const { name, players, playerProfileIds, seed } = team as Record<string, unknown>;

    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.trim().length > 50 ||
      !Array.isArray(players) ||
      !players.every(
        (player) => typeof player === "string" && player.trim().length > 0,
      ) ||
      (playerProfileIds !== undefined &&
        (!Array.isArray(playerProfileIds) ||
          playerProfileIds.length !== players.length ||
          !playerProfileIds.every(
            (playerProfileId) =>
              playerProfileId === null ||
              (typeof playerProfileId === "string" &&
                Types.ObjectId.isValid(playerProfileId)),
          ))) ||
      (seed !== undefined && !Number.isInteger(seed))
    ) {
      return null;
    }

    teams.push({
      name: name.trim(),
      players: players.map((player) => player.trim()),
      ...(Array.isArray(playerProfileIds)
        ? {
            playerProfileIds: playerProfileIds.map((playerProfileId) =>
              typeof playerProfileId === "string" ? playerProfileId : null,
            ),
          }
        : {}),
      seed: (seed as number | undefined) ?? 0,
    });
  }

  return teams;
}

function parseEventDisciplines(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) {
    return null;
  }

  const disciplines: string[] = [];

  for (const discipline of value) {
    if (typeof discipline !== "string") {
      return null;
    }

    const name = discipline.trim();

    if (name.length === 0 || name.length > 80) {
      return null;
    }

    disciplines.push(name);
  }

  return disciplines;
}

function parseUpdateBody(body: unknown): UpdateBody | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const entries = Object.entries(body);

  if (
    entries.length === 0 ||
    entries.some(
      ([key]) =>
        !["eventDisciplines", "name", "teams", "theme"].includes(key),
    )
  ) {
    return null;
  }

  const { eventDisciplines, name, teams, theme } = body as Record<
    string,
    unknown
  >;
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

  if (eventDisciplines !== undefined) {
    const parsedDisciplines = parseEventDisciplines(eventDisciplines);

    if (!parsedDisciplines) {
      return null;
    }

    update.eventDisciplines = parsedDisciplines;
  }

  if (theme !== undefined) {
    if (!isTournamentTheme(theme)) {
      return null;
    }

    update.theme = theme;
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

async function resolveRegisteredTeamPlayers(
  teams: TeamInput[],
): Promise<TeamInput[] | null> {
  const profileIds = teams.flatMap((team) => team.playerProfileIds ?? []).filter(
    (id): id is string => typeof id === "string",
  );
  const uniqueIds = new Set(profileIds);

  if (uniqueIds.size !== profileIds.length) {
    return null;
  }

  if (profileIds.length === 0) {
    return teams;
  }

  const profilesById = await playerProfileMapById(profileIds);

  if (profilesById.size !== uniqueIds.size) {
    return null;
  }

  return teams.map((team) => {
    const playerProfileIds = team.playerProfileIds;

    if (!playerProfileIds) {
      return team;
    }

    return {
      ...team,
      players: team.players.map((player, index) => {
        const playerProfileId = playerProfileIds[index];

        return playerProfileId
          ? profilesById.get(playerProfileId)!.displayName
          : player;
      }),
    };
  });
}

function publicJoinedPlayers(joinedPlayers: IJoinedPlayer[]) {
  return joinedPlayers.map(({ email: _email, ...joinedPlayer }) => joinedPlayer);
}

function tournamentResponseBody(tournament: { toObject(): ITournament }) {
  const responseBody = tournament.toObject();

  return {
    ...responseBody,
    format: responseBody.format ?? "double_elimination",
    theme: responseBody.theme ?? DEFAULT_TOURNAMENT_THEME,
    knockoutBracketType: responseBody.knockoutBracketType ?? "double_elimination",
    firstRoundPairingMode: responseBody.firstRoundPairingMode ?? "random",
    matchResultMode: responseBody.matchResultMode ?? "points",
    knockoutMatchFormat:
      responseBody.knockoutMatchFormat ??
      (responseBody.matchResultMode === "winner_only"
        ? "bo1"
        : "bo3_semis_finals"),
    roundRobinMatchFormat: responseBody.roundRobinMatchFormat ?? "bo1",
    eventParticipantCount: responseBody.eventParticipantCount ?? 2,
    eventDisciplineCount: responseBody.eventDisciplineCount ?? 1,
    eventDisciplines:
      (responseBody.eventDisciplines?.length ?? 0) > 0
        ? responseBody.eventDisciplines
        : defaultEventDisciplines(responseBody.eventDisciplineCount ?? 1),
    eventDrawSeed: responseBody.eventDrawSeed ?? 1,
    joinedPlayers: publicJoinedPlayers(responseBody.joinedPlayers),
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const tournament = await findTournament(id);

    if (!tournament) {
      return jsonError("Tournament not found", "NOT_FOUND", 404);
    }

    return NextResponse.json(tournamentResponseBody(tournament));
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

    if (update.eventDisciplines && tournament.status !== "draft") {
      return jsonError(
        "Disciplines cannot be changed after a tournament has started",
        "CONFLICT",
        409,
      );
    }

    if (update.eventDisciplines) {
      if (
        tournament.format !== "event" ||
        update.eventDisciplines.length !== tournament.eventDisciplineCount
      ) {
        return jsonError(
          "Invalid event disciplines",
          "VALIDATION_ERROR",
          422,
        );
      }
    }

    if (update.name) {
      tournament.name = update.name;
    }

    if (update.theme) {
      tournament.theme = update.theme;
    }

    if (update.teams) {
      const resolvedTeams = await resolveRegisteredTeamPlayers(update.teams);

      if (!resolvedTeams) {
        return jsonError(
          "Invalid registered player roster",
          "VALIDATION_ERROR",
          422,
        );
      }

      tournament.teams = resolvedTeams as ITeam[];
    }

    if (update.eventDisciplines) {
      tournament.eventDisciplines = update.eventDisciplines;
    }

    await tournament.save();

    return NextResponse.json(tournamentResponseBody(tournament));
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
