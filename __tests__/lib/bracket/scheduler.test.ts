import { describe, expect, it } from "vitest";
import {
  makeMatch,
  makeTeams,
  makeTournament,
} from "@/__tests__/helpers/factories";
import {
  autoAssignReadyMatches,
  assignMatchToCourt,
} from "@/lib/bracket/scheduler";
import type { ITournament } from "@/lib/models/Tournament";

function tournament(overrides: Partial<ITournament>): ITournament {
  return makeTournament(overrides as Parameters<typeof makeTournament>[0]) as ITournament;
}

describe("autoAssignReadyMatches", () => {
  it("fills free courts with ready matches in up-next priority order", () => {
    const teams = makeTeams(6);
    const wbSecond = makeMatch({
      position: 2,
      status: "ready",
      teamA: { teamId: teams[2]._id, sets: [] },
      teamB: { teamId: teams[3]._id, sets: [] },
    });
    const lbFirst = makeMatch({
      bracket: "loser",
      position: 1,
      status: "ready",
      teamA: { teamId: teams[4]._id, sets: [] },
      teamB: { teamId: teams[5]._id, sets: [] },
    });
    const wbFirst = makeMatch({
      position: 1,
      status: "ready",
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const cup = tournament({
      courtsAvailable: 2,
      matches: [wbSecond, lbFirst, wbFirst],
    });

    const result = autoAssignReadyMatches(cup);

    expect(result.autoStartedMatches).toEqual([
      { matchId: wbFirst._id.toString(), courtNumber: 1 },
      { matchId: wbSecond._id.toString(), courtNumber: 2 },
    ]);
    expect(wbFirst).toMatchObject({ status: "in_progress", courtNumber: 1 });
    expect(wbSecond).toMatchObject({ status: "in_progress", courtNumber: 2 });
    expect(lbFirst).toMatchObject({ status: "ready", courtNumber: null });
  });

  it("uses free courts around already in-progress matches", () => {
    const teams = makeTeams(6);
    const live = makeMatch({
      status: "in_progress",
      courtNumber: 2,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const firstReady = makeMatch({
      position: 1,
      status: "ready",
      teamA: { teamId: teams[2]._id, sets: [] },
      teamB: { teamId: teams[3]._id, sets: [] },
    });
    const secondReady = makeMatch({
      position: 2,
      status: "ready",
      teamA: { teamId: teams[4]._id, sets: [] },
      teamB: { teamId: teams[5]._id, sets: [] },
    });
    const cup = tournament({
      courtsAvailable: 3,
      currentMatchIds: [live._id],
      matches: [live, secondReady, firstReady],
    });

    const result = autoAssignReadyMatches(cup);

    expect(result.autoStartedMatches).toEqual([
      { matchId: firstReady._id.toString(), courtNumber: 1 },
      { matchId: secondReady._id.toString(), courtNumber: 3 },
    ]);
    expect(cup.currentMatchIds.map((id) => id.toString())).toEqual([
      live._id.toString(),
      firstReady._id.toString(),
      secondReady._id.toString(),
    ]);
  });

  it("ignores non-playable matches and returns no assignments when courts are full", () => {
    const teams = makeTeams(4);
    const live = makeMatch({
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const ready = makeMatch({
      status: "ready",
      teamA: { teamId: teams[2]._id, sets: [] },
      teamB: { teamId: teams[3]._id, sets: [] },
    });
    const pending = makeMatch();
    const bye = makeMatch({ isBye: true, status: "completed" });
    const cup = tournament({
      courtsAvailable: 1,
      currentMatchIds: [live._id],
      matches: [ready, pending, bye, live],
    });

    const result = autoAssignReadyMatches(cup);

    expect(result.autoStartedMatches).toEqual([]);
    expect(ready).toMatchObject({ status: "ready", courtNumber: null });
  });
});

describe("assignMatchToCourt", () => {
  it("can replace the match currently occupying a court", () => {
    const teams = makeTeams(4);
    const live = makeMatch({
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const ready = makeMatch({
      status: "ready",
      teamA: { teamId: teams[2]._id, sets: [] },
      teamB: { teamId: teams[3]._id, sets: [] },
    });
    const cup = tournament({
      courtsAvailable: 1,
      currentMatchIds: [live._id],
      matches: [live, ready],
    });

    const result = assignMatchToCourt(cup, ready, 1);

    expect(result).toEqual({
      matchId: ready._id.toString(),
      courtNumber: 1,
      replacedMatchId: live._id.toString(),
    });
    expect(live).toMatchObject({ status: "ready", courtNumber: null });
    expect(ready).toMatchObject({ status: "in_progress", courtNumber: 1 });
    expect(cup.currentMatchIds.map((id) => id.toString())).toEqual([
      ready._id.toString(),
    ]);
  });
});
