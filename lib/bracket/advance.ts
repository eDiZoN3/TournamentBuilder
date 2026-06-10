import { Types } from "mongoose";
import { determineMatchWinner, type TeamSide } from "@/lib/scoring";
import type { IMatch, ITournament } from "@/lib/models/Tournament";

type Slot = "A" | "B";

export interface MatchCompletionResult {
  tournamentCompleted: boolean;
  nextMatchesReady: string[];
}

function idsEqual(
  first: Types.ObjectId | string,
  second: Types.ObjectId | string,
): boolean {
  return first.toString() === second.toString();
}

function findMatch(tournament: ITournament, id: Types.ObjectId): IMatch {
  const match = tournament.matches.find((candidate) =>
    idsEqual(candidate._id, id),
  );

  if (!match) {
    throw new Error("Next match not found");
  }

  return match;
}

function setMatchReady(match: IMatch, nextMatchesReady: Set<string>) {
  if (match.status === "pending" && match.teamA && match.teamB) {
    match.status = "ready";
    nextMatchesReady.add(match._id.toString());
  }
}

function autoCompleteBye(
  tournament: ITournament,
  match: IMatch,
  nextMatchesReady: Set<string>,
  visited: Set<string>,
) {
  const id = match._id.toString();

  if (visited.has(id) || match.status === "completed") {
    return;
  }

  if (match.teamA && match.teamB) {
    setMatchReady(match, nextMatchesReady);
    return;
  }

  visited.add(id);

  const winner = match.teamA ?? match.teamB;
  match.status = "completed";
  match.winnerId = winner?.teamId ?? null;
  match.loserId = null;
  match.courtNumber = null;

  routeOutcome(
    tournament,
    match.winnerNextMatchId,
    match.winnerNextSlot,
    winner?.teamId ?? null,
    nextMatchesReady,
    visited,
  );
  routeOutcome(
    tournament,
    match.loserNextMatchId,
    match.loserNextSlot,
    null,
    nextMatchesReady,
    visited,
  );
}

function routeOutcome(
  tournament: ITournament,
  nextMatchId: Types.ObjectId | null,
  nextSlot: Slot | null,
  teamId: Types.ObjectId | null,
  nextMatchesReady: Set<string>,
  visited: Set<string>,
) {
  if (!nextMatchId || !nextSlot) {
    return;
  }

  const nextMatch = findMatch(tournament, nextMatchId);

  if (teamId) {
    nextMatch[nextSlot === "A" ? "teamA" : "teamB"] = {
      teamId,
      sets: [],
    };
  } else {
    nextMatch.isBye = true;
  }

  if (nextMatch.isBye && (!nextMatch.teamA || !nextMatch.teamB)) {
    autoCompleteBye(tournament, nextMatch, nextMatchesReady, visited);
    return;
  }

  setMatchReady(nextMatch, nextMatchesReady);
}

export function canMarkInProgress(tournament: ITournament): boolean {
  if ((tournament.matchResultMode ?? "points") === "winner_only") return true;
  return tournament.currentMatchIds.length < tournament.courtsAvailable;
}

export function assignCourt(
  tournament: ITournament,
  match: IMatch,
): number | null {
  if (match.status !== "ready") {
    throw new Error("Only ready matches can be marked in progress");
  }

  if ((tournament.matchResultMode ?? "points") === "winner_only") {
    match.status = "in_progress";
    match.courtNumber = null;
    if (
      !tournament.currentMatchIds.some((matchId) =>
        idsEqual(matchId, match._id),
      )
    ) {
      tournament.currentMatchIds.push(match._id);
    }
    return null;
  }

  if (!canMarkInProgress(tournament)) {
    throw new Error("No courts available");
  }

  const occupiedCourts = new Set(
    tournament.matches
      .filter((candidate) => candidate.status === "in_progress")
      .map((candidate) => candidate.courtNumber)
      .filter((courtNumber): courtNumber is number => courtNumber !== null),
  );
  const courtNumber = Array.from(
    {
      length: tournament.courtsAvailable,
    },
    (_, index) => index + 1,
  ).find((candidate) => !occupiedCourts.has(candidate));

  if (!courtNumber) {
    throw new Error("No courts available");
  }

  match.status = "in_progress";
  match.courtNumber = courtNumber;

  if (
    !tournament.currentMatchIds.some((matchId) => idsEqual(matchId, match._id))
  ) {
    tournament.currentMatchIds.push(match._id);
  }

  return courtNumber;
}

export function onMatchComplete(
  tournament: ITournament,
  match: IMatch,
  selectedWinnerSide?: TeamSide,
): MatchCompletionResult {
  if (match.status !== "in_progress") {
    throw new Error("Only in-progress matches can be completed");
  }

  if (!match.teamA || !match.teamB) {
    throw new Error("Both teams are required to complete a match");
  }

  let winner: TeamSide | null = null;

  if (selectedWinnerSide) {
    if ((tournament.matchResultMode ?? "points") !== "winner_only") {
      throw new Error("Winner-only completion is not enabled");
    }

    winner = selectedWinnerSide;
  } else if ((tournament.matchResultMode ?? "points") === "winner_only") {
    throw new Error("Winner side is required");
  } else {
    const sets =
      match.teamA.sets.length > 0 ? match.teamA.sets : match.teamB.sets;
    winner = determineMatchWinner(sets, match.format);
  }

  if (!winner) {
    throw new Error("Match winner has not been determined");
  }

  const winnerId = winner === "A" ? match.teamA.teamId : match.teamB.teamId;
  const loserId = winner === "A" ? match.teamB.teamId : match.teamA.teamId;
  const nextMatchesReady = new Set<string>();
  const visited = new Set<string>();

  match.winnerId = winnerId;
  match.loserId = loserId;
  match.status = "completed";
  match.courtNumber = null;
  tournament.currentMatchIds = tournament.currentMatchIds.filter(
    (matchId) => !idsEqual(matchId, match._id),
  );

  routeOutcome(
    tournament,
    match.winnerNextMatchId,
    match.winnerNextSlot,
    winnerId,
    nextMatchesReady,
    visited,
  );
  routeOutcome(
    tournament,
    match.loserNextMatchId,
    match.loserNextSlot,
    loserId,
    nextMatchesReady,
    visited,
  );

  const tournamentCompleted = tournament.matches.every(
    (candidate) => candidate.isBye || candidate.status === "completed",
  );

  if (tournamentCompleted) {
    tournament.status = "completed";
  }

  return {
    tournamentCompleted,
    nextMatchesReady: [...nextMatchesReady],
  };
}

