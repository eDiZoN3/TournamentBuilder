import { Types } from "mongoose";
import type { IMatch, ITeamSlot, ITournament } from "@/lib/models/Tournament";

type Slot = "A" | "B";

export interface MatchRollbackResult {
  affectedMatchIds: string[];
}

function idsEqual(
  first: Types.ObjectId | string,
  second: Types.ObjectId | string,
): boolean {
  return first.toString() === second.toString();
}

function slotKey(slot: Slot): "teamA" | "teamB" {
  return slot === "A" ? "teamA" : "teamB";
}

function findMatch(tournament: ITournament, id: Types.ObjectId): IMatch {
  const match = tournament.matches.find((candidate) =>
    idsEqual(candidate._id, id),
  );

  if (!match) {
    throw new Error("Downstream match not found");
  }

  return match;
}

function clearSets(slot: ITeamSlot | null) {
  if (slot) {
    slot.sets = [];
  }
}

function removeCurrentMatch(tournament: ITournament, match: IMatch) {
  tournament.currentMatchIds = tournament.currentMatchIds.filter(
    (matchId) => !idsEqual(matchId, match._id),
  );
}

function resetMatchAfterSlotClear(tournament: ITournament, match: IMatch) {
  clearSets(match.teamA);
  clearSets(match.teamB);
  match.winnerId = null;
  match.loserId = null;
  match.courtNumber = null;
  removeCurrentMatch(tournament, match);

  if (match.isBye) {
    const remainingTeam = match.teamA ?? match.teamB;

    match.status = "completed";
    match.winnerId = remainingTeam?.teamId ?? null;
    return;
  }

  match.status = match.teamA && match.teamB ? "ready" : "pending";
}

export function rollbackCompletedMatch(
  tournament: ITournament,
  match: IMatch,
): MatchRollbackResult {
  if (match.status !== "completed") {
    throw new Error("Only completed matches can be rolled back");
  }

  const affectedMatchIds: string[] = [];
  const affected = new Set<string>();

  function clearReceivedTeam(
    nextMatchId: Types.ObjectId | null,
    nextSlot: Slot | null,
    teamId: Types.ObjectId | null,
  ) {
    if (!nextMatchId || !nextSlot || !teamId) {
      return;
    }

    const target = findMatch(tournament, nextMatchId);
    const key = slotKey(nextSlot);
    const slot = target[key];

    if (!slot || !idsEqual(slot.teamId, teamId)) {
      return;
    }

    const targetId = target._id.toString();

    if (!affected.has(targetId)) {
      affected.add(targetId);
      affectedMatchIds.push(targetId);

      clearReceivedTeam(
        target.winnerNextMatchId,
        target.winnerNextSlot,
        target.winnerId,
      );
      clearReceivedTeam(
        target.loserNextMatchId,
        target.loserNextSlot,
        target.loserId,
      );
    }

    target[key] = null;
    resetMatchAfterSlotClear(tournament, target);
  }

  clearReceivedTeam(
    match.winnerNextMatchId,
    match.winnerNextSlot,
    match.winnerId,
  );
  clearReceivedTeam(
    match.loserNextMatchId,
    match.loserNextSlot,
    match.loserId,
  );

  if (tournament.status === "completed") {
    tournament.status = "active";
  }

  return {
    affectedMatchIds,
  };
}
