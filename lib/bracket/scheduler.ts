import type { IMatch, ITournament } from "@/lib/models/Tournament";

export interface AutoStartedMatch {
  matchId: string;
  courtNumber: number;
}

export interface AutoScheduleResult {
  autoStartedMatches: AutoStartedMatch[];
}

export interface CourtAssignmentResult {
  matchId: string;
  courtNumber: number;
  replacedMatchId: string | null;
}

function idsEqual(
  first: { toString(): string },
  second: { toString(): string },
): boolean {
  return first.toString() === second.toString();
}

function removeCurrentMatch(tournament: ITournament, match: IMatch) {
  tournament.currentMatchIds = tournament.currentMatchIds.filter(
    (matchId) => !idsEqual(matchId, match._id),
  );
}

function addCurrentMatch(tournament: ITournament, match: IMatch) {
  if (
    !tournament.currentMatchIds.some((matchId) => idsEqual(matchId, match._id))
  ) {
    tournament.currentMatchIds.push(match._id);
  }
}

function occupiedCourtNumbers(tournament: ITournament): Set<number> {
  return new Set(
    tournament.matches
      .filter((match) => match.status === "in_progress")
      .map((match) => match.courtNumber)
      .filter((courtNumber): courtNumber is number => courtNumber !== null),
  );
}

function lowestFreeCourt(tournament: ITournament): number | null {
  const occupied = occupiedCourtNumbers(tournament);

  for (let courtNumber = 1; courtNumber <= tournament.courtsAvailable; courtNumber += 1) {
    if (!occupied.has(courtNumber)) {
      return courtNumber;
    }
  }

  return null;
}

function readyMatchSort(first: IMatch, second: IMatch): number {
  if (first.bracket !== second.bracket) {
    return first.bracket === "winner" ? -1 : 1;
  }

  return first.round - second.round || first.position - second.position;
}

function validateCourtNumber(tournament: ITournament, courtNumber: number) {
  if (
    !Number.isInteger(courtNumber) ||
    courtNumber < 1 ||
    courtNumber > tournament.courtsAvailable
  ) {
    throw new Error("Invalid court number");
  }
}

function validateAssignableMatch(match: IMatch) {
  if (
    match.isBye ||
    (match.status !== "ready" && match.status !== "in_progress")
  ) {
    throw new Error("Only ready or in-progress matches can be assigned to a court");
  }
}

export function assignMatchToCourt(
  tournament: ITournament,
  match: IMatch,
  courtNumber: number,
): CourtAssignmentResult {
  validateCourtNumber(tournament, courtNumber);
  validateAssignableMatch(match);

  const occupyingMatch = tournament.matches.find(
    (candidate) =>
      candidate.status === "in_progress" &&
      candidate.courtNumber === courtNumber &&
      !idsEqual(candidate._id, match._id),
  );

  if (occupyingMatch) {
    occupyingMatch.status = "ready";
    occupyingMatch.courtNumber = null;
    removeCurrentMatch(tournament, occupyingMatch);
  }

  match.status = "in_progress";
  match.courtNumber = courtNumber;
  addCurrentMatch(tournament, match);

  return {
    matchId: match._id.toString(),
    courtNumber,
    replacedMatchId: occupyingMatch?._id.toString() ?? null,
  };
}

export function autoAssignReadyMatches(
  tournament: ITournament,
): AutoScheduleResult {
  if ((tournament.matchResultMode ?? "points") === "winner_only") {
    return { autoStartedMatches: [] };
  }

  const autoStartedMatches: AutoStartedMatch[] = [];
  const readyMatches = tournament.matches
    .filter((match) => match.status === "ready" && !match.isBye)
    .sort(readyMatchSort);

  for (const match of readyMatches) {
    if (tournament.currentMatchIds.length >= tournament.courtsAvailable) {
      break;
    }

    const courtNumber = lowestFreeCourt(tournament);

    if (!courtNumber) {
      break;
    }

    const assignment = assignMatchToCourt(tournament, match, courtNumber);

    autoStartedMatches.push({
      matchId: assignment.matchId,
      courtNumber: assignment.courtNumber,
    });
  }

  return {
    autoStartedMatches,
  };
}
