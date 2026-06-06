import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError } from "@/lib/api";
import { assignPlayersToEqualTeams } from "@/lib/bracket/playerAssign";
import { generateBracket } from "@/lib/bracket/generate";
import { autoAssignReadyMatches } from "@/lib/bracket/scheduler";
import { connectDB } from "@/lib/db";
import {
  Tournament,
  type IJoinedPlayer,
  type IMatch,
  type ITeam,
  type RoundRobinMatchFormat,
} from "@/lib/models/Tournament";
import { generateIndividualMixerSchedule } from "@/lib/round-robin/individualMixer";
import { generateTeamRoundRobinSchedule } from "@/lib/round-robin/teamSchedule";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function playerRoster(tournament: {
  joinedPlayers: IJoinedPlayer[];
  teams: ITeam[];
}): string[] {
  return [
    ...tournament.teams.flatMap((team) =>
      team.players.length > 0 ? team.players : [team.name],
    ),
    ...tournament.joinedPlayers.map((player) => player.displayName),
  ];
}

function normalizeRosterName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function uniquePlayerRoster(tournament: {
  joinedPlayers: IJoinedPlayer[];
  teams: ITeam[];
}): string[] {
  const seen = new Set<string>();
  const roster: string[] = [];
  const candidates = [
    ...tournament.teams.flatMap((team) =>
      team.players.length > 0 ? team.players : [team.name],
    ),
    ...tournament.joinedPlayers.map((player) => player.displayName),
  ];

  for (const candidate of candidates) {
    const name = normalizeRosterName(candidate);
    const key = name.toLowerCase();

    if (!name || seen.has(key)) {
      continue;
    }

    seen.add(key);
    roster.push(name);
  }

  return roster;
}

function hasGeneratedEqualTeams(tournament: {
  joinedPlayers: IJoinedPlayer[];
  teamSize: 2 | 3 | 4;
  teams: ITeam[];
}): boolean {
  if (
    tournament.teams.length < 2 ||
    tournament.teams.some(
      (team) =>
        !team.name.trim() ||
        team.players.length !== tournament.teamSize ||
        team.players.some((player) => !player.trim()),
    )
  ) {
    return false;
  }

  const teamRosterKeys = new Set(
    tournament.teams
      .flatMap((team) => team.players)
      .map((player) => normalizeRosterName(player).toLowerCase()),
  );
  const totalPlayerSlots = tournament.teams.length * tournament.teamSize;

  if (teamRosterKeys.size !== totalPlayerSlots) {
    return false;
  }

  return tournament.joinedPlayers.every((player) =>
    teamRosterKeys.has(normalizeRosterName(player.displayName).toLowerCase()),
  );
}

function generatedTeamDocuments(
  players: string[],
  teamSize: 2 | 3 | 4,
): ITeam[] {
  return assignPlayersToEqualTeams(players, teamSize).map((team) => ({
    _id: new Types.ObjectId(),
    ...team,
  })) as ITeam[];
}

export async function POST(_request: NextRequest, context: RouteContext) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  const { id } = await context.params;

  if (!Types.ObjectId.isValid(id)) {
    return jsonError("Tournament not found", "NOT_FOUND", 404);
  }

  try {
    await connectDB();

    const tournament = await Tournament.findById(id);

    if (!tournament) {
      return jsonError("Tournament not found", "NOT_FOUND", 404);
    }

    if (tournament.status !== "draft") {
      return jsonError("Tournament has already started", "CONFLICT", 409);
    }

    const format = tournament.format ?? "double_elimination";
    const roundRobinMatchFormat =
      (tournament.roundRobinMatchFormat ?? "bo1") as RoundRobinMatchFormat;
    let matches: IMatch[] = [];

    if (format === "team_round_robin") {
      if (tournament.inputMode === "players") {
        try {
          if (!hasGeneratedEqualTeams(tournament)) {
            tournament.teams = generatedTeamDocuments(
              uniquePlayerRoster(tournament),
              tournament.teamSize,
            );
          }
        } catch (assignmentError) {
          return jsonError(
            assignmentError instanceof Error
              ? assignmentError.message
              : "Unable to generate teams",
            "VALIDATION_ERROR",
            422,
          );
        }
      }

      if (tournament.teams.length < 2) {
        return jsonError(
          "At least two teams are required",
          "VALIDATION_ERROR",
          422,
        );
      }

      matches = generateTeamRoundRobinSchedule(
        tournament.teams as ITeam[],
        roundRobinMatchFormat,
      );
    } else if (format === "individual_mixer") {
      const players = playerRoster(tournament);
      const minimumPlayers = tournament.teamSize * 2;

      if (players.length < minimumPlayers) {
        return jsonError(
          `At least ${minimumPlayers} players are required`,
          "VALIDATION_ERROR",
          422,
        );
      }

      const schedule = generateIndividualMixerSchedule(
        players,
        tournament.teamSize,
      );

      if (schedule.matches.length === 0) {
        return jsonError(
          "Unable to generate mixer schedule",
          "VALIDATION_ERROR",
          422,
        );
      }

      tournament.teams = schedule.teams as ITeam[];
      matches = schedule.matches;
    } else {
      if (tournament.teams.length < 2) {
        return jsonError(
          "At least two teams are required",
          "VALIDATION_ERROR",
          422,
        );
      }

      if (
        tournament.inputMode === "players" &&
        tournament.teams.some((team) => team.players.length < 2)
      ) {
        return jsonError(
          "Each generated team must have at least two players",
          "VALIDATION_ERROR",
          422,
        );
      }

      matches = generateBracket(
        tournament.teams as ITeam[],
        tournament.courtsAvailable,
      );
    }

    tournament.matches = matches as IMatch[];
    tournament.status = "active";
    const scheduling = autoAssignReadyMatches(tournament);

    await tournament.save();

    return NextResponse.json({
      tournamentId: tournament._id.toString(),
      format,
      matchesGenerated: matches.length,
      byeCount: matches.filter((match) => match.isBye).length,
      autoStartedMatches: scheduling.autoStartedMatches,
    });
  } catch {
    return jsonError("Unable to start tournament", "INTERNAL_ERROR", 500);
  }
}
