import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { PracticeMatch } from "@/lib/models/PracticeMatch";

function participant(displayName: string, id = new Types.ObjectId()) {
  return {
    playerProfileId: id,
    displayName,
  };
}

describe("PracticeMatch model", () => {
  it("stores a valid completed 1v1 practice match", async () => {
    const aliceId = new Types.ObjectId();
    const bobId = new Types.ObjectId();

    const match = await PracticeMatch.create({
      createdBy: aliceId,
      playedAt: new Date("2026-06-06T12:00:00.000Z"),
      sideA: [participant("Alice", aliceId)],
      sideB: [participant("Bob", bobId)],
      sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 }],
      winnerSide: "A",
    });

    expect(match._id).toBeInstanceOf(Types.ObjectId);
    expect(match.sideA[0].displayName).toBe("Alice");
    expect(match.winnerSide).toBe("A");
  });

  it("requires the creator to participate on one side", async () => {
    await expect(
      PracticeMatch.create({
        createdBy: new Types.ObjectId(),
        playedAt: new Date(),
        sideA: [participant("Alice")],
        sideB: [participant("Bob")],
        sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 }],
        winnerSide: "A",
      }),
    ).rejects.toThrow(/creator/i);
  });

  it("rejects duplicate participants and uneven sides", async () => {
    const aliceId = new Types.ObjectId();

    await expect(
      PracticeMatch.create({
        createdBy: aliceId,
        playedAt: new Date(),
        sideA: [participant("Alice", aliceId), participant("Alice", aliceId)],
        sideB: [participant("Bob"), participant("Cara")],
        sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 }],
        winnerSide: "A",
      }),
    ).rejects.toThrow(/duplicate/i);

    await expect(
      PracticeMatch.create({
        createdBy: aliceId,
        playedAt: new Date(),
        sideA: [participant("Alice", aliceId)],
        sideB: [participant("Bob"), participant("Cara")],
        sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 }],
        winnerSide: "A",
      }),
    ).rejects.toThrow(/same size/i);
  });
});
