import { afterEach, describe, expect, it, vi } from "vitest";
import { makeTeams } from "@/__tests__/helpers/factories";
import {
  generateBracket,
  generateSeedPositions,
} from "@/lib/bracket/generate";
import type { IMatch } from "@/lib/models/Tournament";

function orderedBracket(teamCount: number) {
  vi.spyOn(Math, "random").mockReturnValue(0.999);
  return generateBracket(makeTeams(teamCount), 2);
}

function matchesIn(
  matches: IMatch[],
  bracket: IMatch["bracket"],
  round: number,
) {
  return matches
    .filter((match) => match.bracket === bracket && match.round === round)
    .sort((a, b) => a.position - b.position);
}

describe("generateSeedPositions", () => {
  it.each([
    [2, [1]],
    [4, [1, 2]],
    [8, [1, 4, 2, 3]],
    [16, [1, 8, 4, 5, 2, 7, 3, 6]],
  ])("generates the standard positions for a %i-slot bracket", (size, positions) => {
    expect(generateSeedPositions(size)).toEqual(positions);
  });
});

describe("generateBracket", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [2, 1],
    [3, 4],
    [4, 4],
    [5, 12],
    [6, 12],
    [7, 12],
    [8, 12],
    [16, 28],
  ])("creates %i-team brackets with the expected stored match count", (teamCount, matchCount) => {
    expect(orderedBracket(teamCount)).toHaveLength(matchCount);
  });

  it("places teams into the standard 8-slot WB R1 order", () => {
    const teams = makeTeams(8);
    vi.spyOn(Math, "random").mockReturnValue(0.999);

    const matches = matchesIn(generateBracket(teams, 2), "winner", 1);

    expect(
      matches.map((match) => [
        teams.findIndex((team) => team._id.equals(match.teamA?.teamId)) + 1,
        teams.findIndex((team) => team._id.equals(match.teamB?.teamId)) + 1,
      ]),
    ).toEqual([
      [1, 8],
      [4, 5],
      [2, 7],
      [3, 6],
    ]);
  });

  it("wires adjacent WB winners into the next WB round", () => {
    const matches = orderedBracket(8);
    const wbR1 = matchesIn(matches, "winner", 1);
    const wbR2 = matchesIn(matches, "winner", 2);

    expect(wbR1[0]).toMatchObject({
      winnerNextMatchId: wbR2[0]._id,
      winnerNextSlot: "A",
    });
    expect(wbR1[1]).toMatchObject({
      winnerNextMatchId: wbR2[0]._id,
      winnerNextSlot: "B",
    });
  });

  it("cross-pairs WB R1 losers into LB R1", () => {
    const matches = orderedBracket(8);
    const wbR1 = matchesIn(matches, "winner", 1);
    const lbR1 = matchesIn(matches, "loser", 1);

    expect(wbR1[0]).toMatchObject({
      loserNextMatchId: lbR1[0]._id,
      loserNextSlot: "A",
    });
    expect(wbR1[3]).toMatchObject({
      loserNextMatchId: lbR1[0]._id,
      loserNextSlot: "B",
    });
    expect(wbR1[1]).toMatchObject({
      loserNextMatchId: lbR1[1]._id,
      loserNextSlot: "A",
    });
    expect(wbR1[2]).toMatchObject({
      loserNextMatchId: lbR1[1]._id,
      loserNextSlot: "B",
    });
  });

  it("reverse-pairs WB R2 losers against forward LB winners", () => {
    const matches = orderedBracket(8);
    const wbR2 = matchesIn(matches, "winner", 2);
    const lbR1 = matchesIn(matches, "loser", 1);
    const lbR2 = matchesIn(matches, "loser", 2);

    expect(wbR2[1]).toMatchObject({
      loserNextMatchId: lbR2[0]._id,
      loserNextSlot: "A",
    });
    expect(lbR1[0]).toMatchObject({
      winnerNextMatchId: lbR2[0]._id,
      winnerNextSlot: "B",
    });
    expect(wbR2[0]).toMatchObject({
      loserNextMatchId: lbR2[1]._id,
      loserNextSlot: "A",
    });
    expect(lbR1[1]).toMatchObject({
      winnerNextMatchId: lbR2[1]._id,
      winnerNextSlot: "B",
    });
  });

  it("sets final flags and BO3 formats", () => {
    const matches = orderedBracket(16);
    const wbMatches = matches.filter((match) => match.bracket === "winner");
    const lbMatches = matches.filter((match) => match.bracket === "loser");

    expect(wbMatches.filter((match) => match.isWBFinal)).toHaveLength(1);
    expect(lbMatches.filter((match) => match.isLBFinal)).toHaveLength(1);
    expect(
      wbMatches
        .filter((match) => match.round <= 2)
        .every((match) => match.format === "bo1"),
    ).toBe(true);
    expect(
      wbMatches
        .filter((match) => match.round >= 3)
        .every((match) => match.format === "bo3"),
    ).toBe(true);
    expect(
      lbMatches.every((match) =>
        match.isLBFinal ? match.format === "bo3" : match.format === "bo1",
      ),
    ).toBe(true);
  });

  it("only creates a WB final for two teams", () => {
    const matches = orderedBracket(2);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      bracket: "winner",
      isWBFinal: true,
      format: "bo3",
      status: "ready",
    });
  });

  it("auto-completes WB byes and propagates lucky-loser byes", () => {
    const matches = orderedBracket(3);
    const wbR1 = matchesIn(matches, "winner", 1);
    const lbFinal = matchesIn(matches, "loser", 1)[0];
    const byeMatch = wbR1.find((match) => match.isBye);

    expect(byeMatch).toMatchObject({
      status: "completed",
      winnerId: expect.anything(),
      loserId: null,
    });
    expect(lbFinal).toMatchObject({
      isBye: true,
      isLBFinal: true,
      status: "pending",
    });
  });

  it("auto-fills later WB rounds from generated byes", () => {
    const matches = orderedBracket(5);
    const wbR2 = matchesIn(matches, "winner", 2);

    expect(wbR2.some((match) => match.teamA || match.teamB)).toBe(true);
  });

  it("only points connections at stored matches", () => {
    const matches = orderedBracket(16);
    const ids = new Set(matches.map((match) => match._id.toString()));

    for (const match of matches) {
      for (const nextMatchId of [
        match.winnerNextMatchId,
        match.loserNextMatchId,
      ]) {
        if (nextMatchId) {
          expect(ids.has(nextMatchId.toString())).toBe(true);
        }
      }
    }
  });
});
