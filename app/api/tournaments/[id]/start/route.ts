import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { jsonError } from "@/lib/api";
import { generateBracket } from "@/lib/bracket/generate";
import { autoAssignReadyMatches } from "@/lib/bracket/scheduler";
import { connectDB } from "@/lib/db";
import {
  Tournament,
  type IJoinedPlayer,
  type IMatch,
  type ITeam,
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
    let matches: IMatch[] = [];

    if (format === "team_round_robin") {
      if (tournament.teams.length < 2) {
        return jsonError(
          "At least two teams are required",
          "VALIDATION_ERROR",
          422,
        );
      }

      matches = generateTeamRoundRobinSchedule(tournament.teams as ITeam[]);
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
