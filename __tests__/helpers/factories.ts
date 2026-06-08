import { Types } from "mongoose";

export interface Team {
  _id: Types.ObjectId;
  name: string;
  players: string[];
  playerProfileIds?: Array<Types.ObjectId | null>;
  seed: number;
}

export interface SetScore {
  scoreA: number;
  scoreB: number;
  pointsToWin: 11 | 21;
}

export interface TeamSlot {
  teamId: Types.ObjectId;
  sets: SetScore[];
}

export type RoundRobinMatchFormat = "bo1" | "bo3";

export interface Match {
  _id: Types.ObjectId;
  bracket: "winner" | "loser";
  round: number;
  position: number;
  label: string;
  placeRange: string;
  format: RoundRobinMatchFormat;
  teamA: TeamSlot | null;
  teamB: TeamSlot | null;
  status: "pending" | "ready" | "in_progress" | "completed";
  winnerId: Types.ObjectId | null;
  loserId: Types.ObjectId | null;
  winnerNextMatchId: Types.ObjectId | null;
  winnerNextSlot: "A" | "B" | null;
  loserNextMatchId: Types.ObjectId | null;
  loserNextSlot: "A" | "B" | null;
  isBye: boolean;
  isWBFinal: boolean;
  isLBFinal: boolean;
  courtNumber: number | null;
}

export type TournamentFormat =
  | "double_elimination"
  | "team_round_robin"
  | "individual_mixer";

export interface Tournament {
  _id: Types.ObjectId;
  name: string;
  status: "draft" | "active" | "completed";
  format: TournamentFormat;
  roundRobinMatchFormat: RoundRobinMatchFormat;
  teamSize: 2 | 3 | 4;
  courtsAvailable: number;
  inputMode: "teams" | "players";
  allowSelfJoin: boolean;
  createdAt: Date;
  teams: Team[];
  joinedPlayers: Array<{
    userId: Types.ObjectId | string;
    playerProfileId: Types.ObjectId | string;
    firstName: string;
    surname?: string;
    displayName: string;
    email: string;
    joinedAt: Date | string;
  }>;
  matches: Match[];
  currentMatchIds: Types.ObjectId[];
}

function teamSuffix(index: number): string {
  let value = index + 1;
  let suffix = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    suffix = String.fromCharCode(65 + remainder) + suffix;
    value = Math.floor((value - 1) / 26);
  }

  return suffix;
}

export function makeTeams(count: number): Team[] {
  return Array.from({ length: count }, (_, index) => ({
    _id: new Types.ObjectId(),
    name: `Team ${teamSuffix(index)}`,
    players: [],
    seed: index + 1,
  }));
}

export function makeSet(scoreA: number, scoreB: number): SetScore {
  return {
    scoreA,
    scoreB,
    pointsToWin: Math.max(scoreA, scoreB) >= 21 ? 21 : 11,
  };
}

export function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    _id: new Types.ObjectId(),
    bracket: "winner",
    round: 1,
    position: 1,
    label: "WB Round 1",
    placeRange: "",
    format: "bo1",
    teamA: null,
    teamB: null,
    status: "pending",
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
    ...overrides,
  };
}

export function makeTournament(
  overrides: Partial<Tournament> = {},
): Tournament {
  return {
    _id: new Types.ObjectId(),
    name: "Test Tournament",
    status: "draft",
    format: "double_elimination",
    roundRobinMatchFormat: "bo1",
    teamSize: 2,
    courtsAvailable: 1,
    inputMode: "teams",
    allowSelfJoin: false,
    createdAt: new Date(),
    teams: [],
    joinedPlayers: [],
    matches: [],
    currentMatchIds: [],
    ...overrides,
  };
}

