import { describe, expect, it } from "vitest";
import {
  makeMatch,
  makeSet,
  makeTeams,
  makeTournament,
} from "@/__tests__/helpers/factories";
import { rollbackCompletedMatch } from "@/lib/bracket/rollback";
import type { IMatch, ITournament } from "@/lib/models/Tournament";

function tournament(
  overrides: Parameters<typeof makeTournament>[0],
): ITournament {
  return makeTournament(overrides) as ITournament;
}

describe("rollbackCompletedMatch", () => {
  it("clears winner and loser destinations plus completed downstream paths", () => {
    const teams = makeTeams(6);
    const lbSemi = makeMatch({
      bracket: "loser",
      round: 2,
      position: 1,
      status: "ready",
      teamB: { teamId: teams[2]._id, sets: [] },
    }) as IMatch;
    const wbFinal = makeMatch({
      round: 2,
      position: 1,
      label: "WB Final",
      status: "completed",
      teamA: { teamId: teams[0]._id, sets: [makeSet(11, 9)] },
      teamB: { teamId: teams[2]._id, sets: [] },
      winnerId: teams[0]._id,
      loserId: teams[2]._id,
      loserNextMatchId: lbSemi._id,
      loserNextSlot: "B",
    }) as IMatch;
    const loserTarget = makeMatch({
      bracket: "loser",
      round: 1,
      position: 1,
      status: "in_progress",
      courtNumber: 2,
      teamA: { teamId: teams[1]._id, sets: [makeSet(9, 11)] },
      teamB: { teamId: teams[3]._id, sets: [] },
    }) as IMatch;
    const unaffected = makeMatch({
      bracket: "loser",
      round: 1,
      position: 2,
      status: "completed",
      teamA: { teamId: teams[4]._id, sets: [makeSet(11, 8)] },
      teamB: { teamId: teams[5]._id, sets: [] },
      winnerId: teams[4]._id,
      loserId: teams[5]._id,
    }) as IMatch;
    const source = makeMatch({
      status: "completed",
      teamA: { teamId: teams[0]._id, sets: [makeSet(11, 9)] },
      teamB: { teamId: teams[1]._id, sets: [] },
      winnerId: teams[0]._id,
      loserId: teams[1]._id,
      winnerNextMatchId: wbFinal._id,
      winnerNextSlot: "A",
      loserNextMatchId: loserTarget._id,
      loserNextSlot: "A",
    }) as IMatch;
    const cup = tournament({
      status: "completed",
      teams,
      matches: [source, wbFinal, loserTarget, lbSemi, unaffected],
      currentMatchIds: [loserTarget._id],
    });

    const result = rollbackCompletedMatch(cup, source);

    expect(result.affectedMatchIds).toEqual(
      expect.arrayContaining([
        wbFinal._id.toString(),
        loserTarget._id.toString(),
        lbSemi._id.toString(),
      ]),
    );
    expect(wbFinal).toMatchObject({
      status: "pending",
      teamA: null,
      winnerId: null,
      loserId: null,
      courtNumber: null,
    });
    expect(wbFinal.teamB?.teamId).toEqual(teams[2]._id);
    expect(wbFinal.teamB?.sets).toEqual([]);
    expect(loserTarget).toMatchObject({
      status: "pending",
      teamA: null,
      winnerId: null,
      loserId: null,
      courtNumber: null,
    });
    expect(cup.currentMatchIds).toEqual([]);
    expect(lbSemi).toMatchObject({
      status: "pending",
      teamB: null,
    });
    expect(unaffected).toMatchObject({
      status: "completed",
      winnerId: teams[4]._id,
      loserId: teams[5]._id,
    });
    expect(cup.status).toBe("active");
  });

  it("keeps affected bye matches completed instead of making them playable", () => {
    const teams = makeTeams(3);
    const nextMatch = makeMatch({
      round: 2,
      position: 1,
      status: "ready",
      teamA: { teamId: teams[1]._id, sets: [] },
      teamB: { teamId: teams[2]._id, sets: [] },
    }) as IMatch;
    const byeTarget = makeMatch({
      bracket: "loser",
      round: 1,
      position: 1,
      isBye: true,
      status: "completed",
      teamA: { teamId: teams[1]._id, sets: [] },
      teamB: null,
      winnerId: teams[1]._id,
      loserId: null,
      winnerNextMatchId: nextMatch._id,
      winnerNextSlot: "A",
    }) as IMatch;
    const source = makeMatch({
      status: "completed",
      teamA: { teamId: teams[0]._id, sets: [makeSet(11, 9)] },
      teamB: { teamId: teams[1]._id, sets: [] },
      winnerId: teams[0]._id,
      loserId: teams[1]._id,
      loserNextMatchId: byeTarget._id,
      loserNextSlot: "A",
    }) as IMatch;
    const cup = tournament({
      status: "completed",
      teams,
      matches: [source, byeTarget, nextMatch],
    });

    rollbackCompletedMatch(cup, source);

    expect(byeTarget).toMatchObject({
      isBye: true,
      status: "completed",
      teamA: null,
      winnerId: null,
      loserId: null,
    });
    expect(nextMatch).toMatchObject({
      status: "pending",
      teamA: null,
    });
    expect(cup.status).toBe("active");
  });
});
