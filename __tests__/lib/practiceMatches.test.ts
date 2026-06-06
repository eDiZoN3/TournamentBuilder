import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import {
  parsePracticeMatchPayload,
  serializePracticeMatch,
} from "@/lib/practiceMatches";

const aliceId = new Types.ObjectId();
const bobId = new Types.ObjectId();
const caraId = new Types.ObjectId();

describe("practice match validation", () => {
  it("normalizes a valid payload and derives the winner", () => {
    const parsed = parsePracticeMatchPayload(
      {
        playedAt: "2026-06-06T12:00:00.000Z",
        sideA: [{ playerProfileId: aliceId.toString(), displayName: " Alice " }],
        sideB: [{ playerProfileId: bobId.toString(), displayName: "Bob" }],
        sets: [{ scoreA: 11, scoreB: 8 }],
      },
      aliceId.toString(),
    );

    expect(parsed).toEqual({
      ok: true,
      value: expect.objectContaining({
        createdBy: aliceId,
        winnerSide: "A",
      }),
    });
  });

  it("rejects invalid scores, duplicate participants, and missing creators", () => {
    expect(
      parsePracticeMatchPayload(
        {
          sideA: [{ playerProfileId: aliceId.toString(), displayName: "Alice" }],
          sideB: [{ playerProfileId: bobId.toString(), displayName: "Bob" }],
          sets: [{ scoreA: 11, scoreB: 10 }],
        },
        aliceId.toString(),
      ),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/lead/i) });

    expect(
      parsePracticeMatchPayload(
        {
          sideA: [
            { playerProfileId: aliceId.toString(), displayName: "Alice" },
            { playerProfileId: aliceId.toString(), displayName: "Alice" },
          ],
          sideB: [
            { playerProfileId: bobId.toString(), displayName: "Bob" },
            { playerProfileId: caraId.toString(), displayName: "Cara" },
          ],
          sets: [{ scoreA: 11, scoreB: 8 }],
        },
        aliceId.toString(),
      ),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/duplicate/i) });

    expect(
      parsePracticeMatchPayload(
        {
          sideA: [{ playerProfileId: bobId.toString(), displayName: "Bob" }],
          sideB: [{ playerProfileId: caraId.toString(), displayName: "Cara" }],
          sets: [{ scoreA: 11, scoreB: 8 }],
        },
        aliceId.toString(),
      ),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/creator/i) });
  });

  it("serializes practice matches with stable string ids", () => {
    const serialized = serializePracticeMatch({
      _id: new Types.ObjectId(),
      createdBy: aliceId,
      playedAt: new Date("2026-06-06T12:00:00.000Z"),
      sideA: [{ playerProfileId: aliceId, displayName: "Alice" }],
      sideB: [{ playerProfileId: bobId, displayName: "Bob" }],
      sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 }],
      winnerSide: "A",
      createdAt: new Date("2026-06-06T12:01:00.000Z"),
      updatedAt: new Date("2026-06-06T12:02:00.000Z"),
    });

    expect(serialized).toMatchObject({
      createdBy: aliceId.toString(),
      playedAt: "2026-06-06T12:00:00.000Z",
      sideA: [{ playerProfileId: aliceId.toString(), displayName: "Alice" }],
      winnerSide: "A",
    });
  });
});
