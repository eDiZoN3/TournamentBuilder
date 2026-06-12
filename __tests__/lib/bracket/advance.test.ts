import { afterEach, describe, expect, it, vi } from "vitest";
import { makeSet, makeTeams } from "@/__tests__/helpers/factories";
import {
  assignCourt,
  canMarkInProgress,
  onMatchComplete,
} from "@/lib/bracket/advance";
import { generateBracket } from "@/lib/bracket/generate";
import type { IMatch, ITournament } from "@/lib/models/Tournament";

function tournamentWithTeams(
  teamCount: number,
  courtsAvailable = 2,
  matchResultMode: "points" | "winner_only" = "points",
) {
  vi.spyOn(Math, "random").mockReturnValue(0.999);
  const teams = makeTeams(teamCount);
  const matches = generateBracket(teams, courtsAvailable);

  return {
    _id: teams[0]._id,
    name: "Test Tournament",
    status: "active",
    format: "double_elimination",
    theme: "default",
    knockoutBracketType: "double_elimination",
    firstRoundPairingMode: "random",
    matchResultMode,
    knockoutMatchFormat: "bo3_semis_finals",
    roundRobinMatchFormat: "bo1",
    teamSize: 2,
    courtsAvailable,
    inputMode: "teams",
    allowSelfJoin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    teams,
    joinedPlayers: [],
    matches,
    currentMatchIds: [],
  } as ITournament;
}

function matchesIn(
  tournament: ITournament,
  bracket: IMatch["bracket"],
  round: number,
) {
  return tournament.matches
    .filter((match) => match.bracket === bracket && match.round === round)
    .sort((a, b) => a.position - b.position);
}

function scoreAndStart(
  tournament: ITournament,
  match: IMatch,
  scores: Array<[number, number]>,
) {
  match.status = "in_progress";
  match.courtNumber = 1;
  match.teamA!.sets = scores.map(([scoreA, scoreB]) => makeSet(scoreA, scoreB));
  tournament.currentMatchIds.push(match._id);
}

describe("court assignment", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("assigns the lowest available court and tracks the live match", () => {
    const tournament = tournamentWithTeams(8, 3);
    const readyMatches = matchesIn(tournament, "winner", 1);

    readyMatches[0].status = "in_progress";
    readyMatches[0].courtNumber = 1;
    tournament.currentMatchIds.push(readyMatches[0]._id);

    expect(assignCourt(tournament, readyMatches[1])).toBe(2);
    expect(readyMatches[1]).toMatchObject({
      status: "in_progress",
      courtNumber: 2,
    });
    expect(tournament.currentMatchIds).toContainEqual(readyMatches[1]._id);
  });

  it("rejects assignment when every court is occupied", () => {
    const tournament = tournamentWithTeams(4, 1);
    const readyMatches = matchesIn(tournament, "winner", 1);

    assignCourt(tournament, readyMatches[0]);

    expect(canMarkInProgress(tournament)).toBe(false);
    expect(() => assignCourt(tournament, readyMatches[1])).toThrow(
      "No courts available",
    );
  });

  it("rejects assignment for a match that is not ready", () => {
    const tournament = tournamentWithTeams(4);
    const match = matchesIn(tournament, "winner", 2)[0];

    expect(() => assignCourt(tournament, match)).toThrow(
      "Only ready matches can be marked in progress",
    );
  });

  it("rejects assignment when occupied courts and tracking are inconsistent", () => {
    const tournament = tournamentWithTeams(4, 1);
    const readyMatches = matchesIn(tournament, "winner", 1);

    readyMatches[0].status = "in_progress";
    readyMatches[0].courtNumber = 1;

    expect(() => assignCourt(tournament, readyMatches[1])).toThrow(
      "No courts available",
    );
  });

  it("does not duplicate a tracked match id", () => {
    const tournament = tournamentWithTeams(4);
    const match = matchesIn(tournament, "winner", 1)[0];

    tournament.currentMatchIds.push(match._id);

    assignCourt(tournament, match);

    expect(tournament.currentMatchIds).toEqual([match._id]);
  });
});

describe("winner_only court assignment", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("canMarkInProgress returns true even when every court is occupied", () => {
    const tournament = tournamentWithTeams(4, 1, "winner_only");
    const readyMatches = matchesIn(tournament, "winner", 1);

    assignCourt(tournament, readyMatches[0]);

    expect(canMarkInProgress(tournament)).toBe(true);
  });

  it("assignCourt succeeds even when all points-mode courts would be full", () => {
    const tournament = tournamentWithTeams(4, 1, "winner_only");
    const readyMatches = matchesIn(tournament, "winner", 1);

    assignCourt(tournament, readyMatches[0]);

    expect(() => assignCourt(tournament, readyMatches[1])).not.toThrow();
    expect(readyMatches[1].status).toBe("in_progress");
  });

  it("assignCourt sets in_progress without assigning a court number", () => {
    const tournament = tournamentWithTeams(4, 1, "winner_only");
    const match = matchesIn(tournament, "winner", 1)[0];

    assignCourt(tournament, match);

    expect(match.status).toBe("in_progress");
    expect(match.courtNumber).toBeNull();
    expect(tournament.currentMatchIds.map((id) => id.toString())).toContain(
      match._id.toString(),
    );
  });
});

describe("onMatchComplete", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes WB winners and losers and readies both next matches", () => {
    const tournament = tournamentWithTeams(4);
    const wbR1 = matchesIn(tournament, "winner", 1);
    const wbFinal = matchesIn(tournament, "winner", 2)[0];
    const lbFinal = matchesIn(tournament, "loser", 1)[0];

    scoreAndStart(tournament, wbR1[0], [
      [11, 9],
      [11, 8],
    ]);
    onMatchComplete(tournament, wbR1[0]);

    expect(wbFinal.teamA?.teamId).toEqual(wbR1[0].winnerId);
    expect(lbFinal.teamA?.teamId).toEqual(wbR1[0].loserId);

    scoreAndStart(tournament, wbR1[1], [
      [9, 11],
      [8, 11],
    ]);
    const result = onMatchComplete(tournament, wbR1[1]);

    expect(wbFinal).toMatchObject({ status: "ready" });
    expect(lbFinal).toMatchObject({ status: "ready" });
    expect(result.nextMatchesReady).toEqual(
      expect.arrayContaining([wbFinal._id.toString(), lbFinal._id.toString()]),
    );
  });

  it("auto-completes a lucky-loser bye once its real team arrives", () => {
    const tournament = tournamentWithTeams(3);
    const playableWBR1 = matchesIn(tournament, "winner", 1).find(
      (match) => !match.isBye,
    )!;
    const lbFinal = matchesIn(tournament, "loser", 1)[0];

    scoreAndStart(tournament, playableWBR1, [
      [11, 9],
      [11, 8],
    ]);
    onMatchComplete(tournament, playableWBR1);

    expect(lbFinal).toMatchObject({
      isBye: true,
      status: "completed",
      winnerId: playableWBR1.loserId,
      loserId: null,
    });
  });

  it("records WB final placements and completes a two-team tournament", () => {
    const tournament = tournamentWithTeams(2, 1);
    const wbFinal = matchesIn(tournament, "winner", 1)[0];

    scoreAndStart(tournament, wbFinal, [
      [11, 9],
      [11, 8],
    ]);
    const result = onMatchComplete(tournament, wbFinal);

    expect(wbFinal).toMatchObject({
      status: "completed",
      winnerId: wbFinal.teamA?.teamId,
      loserId: wbFinal.teamB?.teamId,
      winnerNextMatchId: null,
      loserNextMatchId: null,
      courtNumber: null,
    });
    expect(tournament.currentMatchIds).toEqual([]);
    expect(tournament.status).toBe("completed");
    expect(result.tournamentCompleted).toBe(true);
  });

  it("completes a match by selected winner without scores", () => {
    const tournament = tournamentWithTeams(2, 1);
    const wbFinal = matchesIn(tournament, "winner", 1)[0];

    tournament.matchResultMode = "winner_only";
    wbFinal.status = "in_progress";
    wbFinal.courtNumber = 1;
    tournament.currentMatchIds.push(wbFinal._id);

    const result = onMatchComplete(tournament, wbFinal, "B");

    expect(wbFinal).toMatchObject({
      status: "completed",
      winnerId: wbFinal.teamB?.teamId,
      loserId: wbFinal.teamA?.teamId,
      courtNumber: null,
    });
    expect(wbFinal.teamA?.sets).toEqual([]);
    expect(wbFinal.teamB?.sets).toEqual([]);
    expect(tournament.currentMatchIds).toEqual([]);
    expect(result.tournamentCompleted).toBe(true);
  });

  it("rejects winner-only completion for point-scored tournaments", () => {
    const tournament = tournamentWithTeams(2, 1);
    const wbFinal = matchesIn(tournament, "winner", 1)[0];

    wbFinal.status = "in_progress";

    expect(() => onMatchComplete(tournament, wbFinal, "A")).toThrow(
      "Winner-only completion is not enabled",
    );
  });

  it("records LB final placements without routing its loser", () => {
    const tournament = tournamentWithTeams(4);
    const lbFinal = matchesIn(tournament, "loser", 1)[0];
    const teams = tournament.teams;

    lbFinal.teamA = { teamId: teams[0]._id, sets: [] };
    lbFinal.teamB = { teamId: teams[1]._id, sets: [] };
    scoreAndStart(tournament, lbFinal, [
      [9, 11],
      [8, 11],
    ]);
    onMatchComplete(tournament, lbFinal);

    expect(lbFinal).toMatchObject({
      winnerId: teams[1]._id,
      loserId: teams[0]._id,
      winnerNextMatchId: null,
      loserNextMatchId: null,
    });
  });

  it("rejects a match that is not in progress", () => {
    const tournament = tournamentWithTeams(2);
    const match = matchesIn(tournament, "winner", 1)[0];

    expect(() => onMatchComplete(tournament, match)).toThrow(
      "Only in-progress matches can be completed",
    );
  });

  it("rejects an in-progress match without both teams", () => {
    const tournament = tournamentWithTeams(2);
    const match = matchesIn(tournament, "winner", 1)[0];

    match.status = "in_progress";
    match.teamB = null;

    expect(() => onMatchComplete(tournament, match)).toThrow(
      "Both teams are required to complete a match",
    );
  });

  it("rejects an unfinished match and reads scores from team B when needed", () => {
    const tournament = tournamentWithTeams(2);
    const match = matchesIn(tournament, "winner", 1)[0];

    match.status = "in_progress";
    match.teamB!.sets = [makeSet(11, 9)];

    expect(() => onMatchComplete(tournament, match)).toThrow(
      "Match winner has not been determined",
    );
  });

  it("fails explicitly when a routed match id does not exist", () => {
    const tournament = tournamentWithTeams(4);
    const match = matchesIn(tournament, "winner", 1)[0];

    match.winnerNextMatchId = tournament._id;
    scoreAndStart(tournament, match, [
      [11, 9],
      [11, 8],
    ]);

    expect(() => onMatchComplete(tournament, match)).toThrow(
      "Next match not found",
    );
  });
});
