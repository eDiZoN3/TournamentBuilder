import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import {
  Tournament,
  type FirstRoundPairingMode,
  type KnockoutBracketType,
  type KnockoutMatchFormat,
  type MatchResultMode,
  type RoundRobinMatchFormat,
  type TournamentFormat,
} from "@/lib/models/Tournament";

interface CreateTournamentBody {
  allowSelfJoin: boolean;
  firstRoundPairingMode: FirstRoundPairingMode;
  format: TournamentFormat;
  knockoutBracketType: KnockoutBracketType;
  knockoutMatchFormat: KnockoutMatchFormat;
  matchResultMode: MatchResultMode;
  name: string;
  roundRobinMatchFormat: RoundRobinMatchFormat;
  teamSize: 2 | 3 | 4;
  courtsAvailable: number;
  inputMode: "teams" | "players";
}

function parseCreateBody(body: unknown): CreateTournamentBody | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const {
    allowSelfJoin,
    firstRoundPairingMode,
    format,
    knockoutBracketType,
    knockoutMatchFormat,
    matchResultMode,
    name,
    roundRobinMatchFormat,
    teamSize,
    courtsAvailable,
    inputMode,
  } =
    body as Record<string, unknown>;
  const parsedAllowSelfJoin =
    typeof allowSelfJoin === "boolean" ? allowSelfJoin : false;
  const parsedFormat =
    format === undefined
      ? "double_elimination"
      : (format as TournamentFormat);
  const parsedRoundRobinMatchFormat =
    roundRobinMatchFormat === undefined
      ? "bo1"
      : (roundRobinMatchFormat as RoundRobinMatchFormat);
  const parsedKnockoutBracketType =
    knockoutBracketType === undefined
      ? "double_elimination"
      : (knockoutBracketType as KnockoutBracketType);
  const parsedFirstRoundPairingMode =
    firstRoundPairingMode === undefined
      ? "random"
      : (firstRoundPairingMode as FirstRoundPairingMode);
  const parsedMatchResultMode =
    matchResultMode === undefined ? "points" : (matchResultMode as MatchResultMode);
  const parsedKnockoutMatchFormat =
    knockoutMatchFormat === undefined
      ? parsedMatchResultMode === "winner_only"
        ? "bo1"
        : "bo3_semis_finals"
      : (knockoutMatchFormat as KnockoutMatchFormat);

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > 100 ||
    ![2, 3, 4].includes(teamSize as number) ||
    !Number.isInteger(courtsAvailable) ||
    (courtsAvailable as number) < 1 ||
    (courtsAvailable as number) > 10 ||
    !["teams", "players"].includes(inputMode as string) ||
    !["double_elimination", "team_round_robin", "individual_mixer"].includes(
      parsedFormat,
    ) ||
    !["double_elimination", "single_elimination"].includes(
      parsedKnockoutBracketType,
    ) ||
    !["random", "manual"].includes(parsedFirstRoundPairingMode) ||
    !["points", "winner_only"].includes(parsedMatchResultMode) ||
    !["bo3_semis_finals", "bo1"].includes(parsedKnockoutMatchFormat) ||
    !["bo1", "bo3"].includes(parsedRoundRobinMatchFormat) ||
    (parsedFormat === "individual_mixer" && inputMode !== "players") ||
    (parsedAllowSelfJoin && inputMode !== "players") ||
    (parsedFormat !== "team_round_robin" &&
      roundRobinMatchFormat !== undefined &&
      parsedRoundRobinMatchFormat !== "bo1") ||
    (parsedFormat !== "double_elimination" &&
      (knockoutBracketType !== undefined ||
        firstRoundPairingMode !== undefined ||
        matchResultMode !== undefined ||
        knockoutMatchFormat !== undefined)) ||
    (parsedMatchResultMode === "winner_only" &&
      parsedKnockoutMatchFormat !== "bo1")
  ) {
    return null;
  }

  return {
    allowSelfJoin: parsedAllowSelfJoin,
    firstRoundPairingMode: parsedFirstRoundPairingMode,
    format: parsedFormat,
    knockoutBracketType: parsedKnockoutBracketType,
    knockoutMatchFormat: parsedKnockoutMatchFormat,
    matchResultMode: parsedMatchResultMode,
    name: name.trim(),
    roundRobinMatchFormat: parsedRoundRobinMatchFormat,
    teamSize: teamSize as 2 | 3 | 4,
    courtsAvailable: courtsAvailable as number,
    inputMode: inputMode as "teams" | "players",
  };
}

export async function GET() {
  try {
    await connectDB();

    const tournaments = await Tournament.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      tournaments: tournaments.map((tournament) => ({
        _id: tournament._id.toString(),
        name: tournament.name,
        status: tournament.status,
        format: tournament.format ?? "double_elimination",
        knockoutBracketType:
          tournament.knockoutBracketType ?? "double_elimination",
        firstRoundPairingMode: tournament.firstRoundPairingMode ?? "random",
        matchResultMode: tournament.matchResultMode ?? "points",
        knockoutMatchFormat:
          tournament.knockoutMatchFormat ?? "bo3_semis_finals",
        roundRobinMatchFormat: tournament.roundRobinMatchFormat ?? "bo1",
        createdAt: tournament.createdAt.toISOString(),
        allowSelfJoin: tournament.allowSelfJoin,
        teamCount: tournament.teams.length,
        matchCount: tournament.matches.filter((match) => !match.isBye).length,
      })),
    });
  } catch {
    return jsonError(
      "Unable to load tournaments",
      "INTERNAL_ERROR",
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", "VALIDATION_ERROR", 422);
  }

  const parsedBody = parseCreateBody(body);

  if (!parsedBody) {
    return jsonError("Invalid tournament details", "VALIDATION_ERROR", 422);
  }

  try {
    await connectDB();

    const tournament = await Tournament.create(parsedBody);

    return NextResponse.json(
      {
        _id: tournament._id.toString(),
        name: tournament.name,
        status: tournament.status,
        format: tournament.format,
        knockoutBracketType: tournament.knockoutBracketType,
        firstRoundPairingMode: tournament.firstRoundPairingMode,
        matchResultMode: tournament.matchResultMode,
        knockoutMatchFormat: tournament.knockoutMatchFormat,
        roundRobinMatchFormat: tournament.roundRobinMatchFormat,
        teamSize: tournament.teamSize,
        courtsAvailable: tournament.courtsAvailable,
        inputMode: tournament.inputMode,
        allowSelfJoin: tournament.allowSelfJoin,
        teams: tournament.teams,
        matches: tournament.matches,
      },
      {
        status: 201,
      },
    );
  } catch {
    return jsonError(
      "Unable to create tournament",
      "INTERNAL_ERROR",
      500,
    );
  }
}

