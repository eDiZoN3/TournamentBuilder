import { Types } from "mongoose";
import type {
  IMatch,
  ITeam,
  RoundRobinMatchFormat,
} from "@/lib/models/Tournament";

interface IndividualMixerSchedule {
  matches: IMatch[];
  teams: ITeam[];
}

export interface IndividualMixerPlayer {
  displayName: string;
  playerProfileId?: { toString(): string } | string | null;
}

function playerName(player: string | IndividualMixerPlayer): string {
  return typeof player === "string" ? player : player.displayName;
}

function playerProfileId(player: string | IndividualMixerPlayer) {
  return typeof player === "string" ? null : (player.playerProfileId ?? null);
}

function normalizePlayers(
  players: Array<string | IndividualMixerPlayer>,
): IndividualMixerPlayer[] {
  const seen = new Set<string>();
  const normalized: IndividualMixerPlayer[] = [];

  for (const player of players) {
    const name = playerName(player).trim().replace(/\s+/g, " ");
    const profileId = playerProfileId(player);
    const key = profileId
      ? `profile:${profileId.toString()}`
      : `name:${name.toLowerCase()}`;

    if (!name || seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push({
      displayName: name,
      playerProfileId: profileId,
    });
  }

  return normalized;
}

function teamName(round: number, position: number, side: "A" | "B", matchesPerRound: number) {
  return matchesPerRound === 1
    ? `Round ${round} Team ${side}`
    : `Round ${round} Match ${position} Team ${side}`;
}

function createTemporaryTeam(
  players: IndividualMixerPlayer[],
  round: number,
  position: number,
  side: "A" | "B",
  seed: number,
  matchesPerRound: number,
): ITeam {
  const hasProfileIds = players.some((player) => Boolean(player.playerProfileId));

  return {
    _id: new Types.ObjectId(),
    name: teamName(round, position, side, matchesPerRound),
    players: players.map((player) => player.displayName),
    ...(hasProfileIds
      ? {
          playerProfileIds: players.map((player) =>
            player.playerProfileId ? new Types.ObjectId(player.playerProfileId.toString()) : null,
          ),
        }
      : {}),
    seed,
  };
}

function createMatch(
  teamA: ITeam,
  teamB: ITeam,
  round: number,
  position: number,
  format: RoundRobinMatchFormat,
): IMatch {
  return {
    _id: new Types.ObjectId(),
    bracket: "winner",
    round,
    position,
    label: `Round ${round}`,
    placeRange: "",
    format,
    teamA: {
      teamId: teamA._id,
      sets: [],
    },
    teamB: {
      teamId: teamB._id,
      sets: [],
    },
    status: "ready",
    winnerId: null,
    loserId: null,
    winnerNextMatchId: null,
    winnerNextSlot: null,
    loserNextMatchId: null,
    loserNextSlot: null,
    isBye: false,
    isWBFinal: false,
    isLBFinal: false,
    courtNumber: null,
    eventDisciplineIndex: null,
    eventDisciplineName: null,
  };
}

export function generateIndividualMixerSchedule(
  players: Array<string | IndividualMixerPlayer>,
  teamSize: number,
  format: RoundRobinMatchFormat = "bo1",
): IndividualMixerSchedule {
  const roster = normalizePlayers(players);
  const playersPerMatch = teamSize * 2;
  const activePlayerCount =
    Math.floor(roster.length / playersPerMatch) * playersPerMatch;

  if (activePlayerCount < playersPerMatch) {
    return {
      matches: [],
      teams: [],
    };
  }

  const hasSitOuts = roster.length > activePlayerCount;
  const rounds = hasSitOuts ? roster.length : Math.max(1, roster.length - 1);
  const matchesPerRound = activePlayerCount / playersPerMatch;
  const temporaryTeams: ITeam[] = [];
  const matches: IMatch[] = [];
  let seed = 1;

  for (let round = 1; round <= rounds; round += 1) {
    const rotated = [
      ...roster.slice((round - 1) % roster.length),
      ...roster.slice(0, (round - 1) % roster.length),
    ];
    const activePlayers = rotated.slice(0, activePlayerCount);

    for (let index = 0; index < activePlayers.length; index += playersPerMatch) {
      const position = index / playersPerMatch + 1;
      const teamA = createTemporaryTeam(
        activePlayers.slice(index, index + teamSize),
        round,
        position,
        "A",
        seed,
        matchesPerRound,
      );
      const teamB = createTemporaryTeam(
        activePlayers.slice(index + teamSize, index + playersPerMatch),
        round,
        position,
        "B",
        seed + 1,
        matchesPerRound,
      );

      seed += 2;
      temporaryTeams.push(teamA, teamB);
      matches.push(createMatch(teamA, teamB, round, position, format));
    }
  }

  return {
    matches,
    teams: temporaryTeams,
  };
}
