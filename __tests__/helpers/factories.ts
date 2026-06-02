import { Types } from "mongoose";

export interface Team {
  _id: Types.ObjectId;
  name: string;
  players: string[];
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

export interface Match {
  _id: Types.ObjectId;
  bracket: "winner" | "loser";
  round: number;
  position: number;
  label: string;
  placeRange: string;
  format: "bo1" | "bo3";
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

export interface Tournament {
  _id: Types.ObjectId;
  name: string;
  status: "draft" | "active" | "completed";
  teamSize: 2 | 3 | 4;
  courtsAvailable: number;
  inputMode: "teams" | "players";
  createdAt: Date;
  teams: Team[];
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
    teamSize: 2,
    courtsAvailable: 1,
    inputMode: "teams",
    createdAt: new Date(),
    teams: [],
    matches: [],
    currentMatchIds: [],
    ...overrides,
  };
}

