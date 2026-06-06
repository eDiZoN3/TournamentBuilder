import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { aggregatePracticeStats } from "@/lib/practiceStats";

function match(overrides: Record<string, unknown> = {}) {
  const aliceId = new Types.ObjectId();
  const bobId = new Types.ObjectId();

  return {
    _id: new Types.ObjectId(),
    createdBy: aliceId,
    playedAt: new Date("2026-06-06T12:00:00.000Z"),
    sideA: [{ playerProfileId: aliceId, displayName: "Alice" }],
    sideB: [{ playerProfileId: bobId, displayName: "Bob" }],
    sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 }],
    winnerSide: "A",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("aggregatePracticeStats", () => {
  it("counts wins, sets, and points for linked practice players", () => {
    const aliceId = new Types.ObjectId();
    const bobId = new Types.ObjectId();
    const stats = aggregatePracticeStats([
      match({
        createdBy: aliceId,
        sideA: [{ playerProfileId: aliceId, displayName: "Alice" }],
        sideB: [{ playerProfileId: bobId, displayName: "Bob" }],
        sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 }],
        winnerSide: "A",
      }),
    ]);

    expect(stats).toEqual([
      expect.objectContaining({
        playerProfileId: aliceId.toString(),
        name: "Alice",
        matchesPlayed: 1,
        matchesWon: 1,
        setsWon: 1,
        pointsFor: 11,
        pointsAgainst: 8,
        winRate: 1,
      }),
      expect.objectContaining({
        playerProfileId: bobId.toString(),
        name: "Bob",
        matchesPlayed: 1,
        matchesLost: 1,
        setsLost: 1,
        pointsFor: 8,
        pointsAgainst: 11,
        winRate: 0,
      }),
    ]);
  });

  it("skips guest participants without a player profile id", () => {
    const aliceId = new Types.ObjectId();
    const stats = aggregatePracticeStats([
      match({
        createdBy: aliceId,
        sideA: [{ playerProfileId: aliceId, displayName: "Alice" }],
        sideB: [{ displayName: "Guest" }],
      }),
    ]);

    expect(stats).toHaveLength(1);
    expect(stats[0]).toMatchObject({
      playerProfileId: aliceId.toString(),
      name: "Alice",
    });
  });

  it("applies player and all reset rules to practice stats", () => {
    const aliceId = new Types.ObjectId();
    const bobId = new Types.ObjectId();
    const matches = [
      match({
        createdBy: aliceId,
        sideA: [{ playerProfileId: aliceId, displayName: "Alice" }],
        sideB: [{ playerProfileId: bobId, displayName: "Bob" }],
      }),
    ];

    expect(
      aggregatePracticeStats(matches, [
        {
          scope: "player",
          playerProfileId: aliceId,
          playerNameKey: "alice",
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        playerProfileId: bobId.toString(),
        name: "Bob",
      }),
    ]);

    expect(aggregatePracticeStats(matches, [{ scope: "all" }])).toEqual([]);
  });
});
