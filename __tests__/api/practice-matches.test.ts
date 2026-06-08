import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { PracticeMatch } from "@/lib/models/PracticeMatch";

const { requirePlayerSession } = vi.hoisted(() => ({
  requirePlayerSession: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requirePlayerSession,
}));

import {
  GET as listPracticeMatches,
  POST as createPracticeMatch,
} from "@/app/api/practice-matches/route";
import {
  DELETE as deletePracticeMatch,
  PUT as updatePracticeMatch,
} from "@/app/api/practice-matches/[id]/route";

function request(
  url: string,
  method = "GET",
  body?: Record<string, unknown>,
) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : undefined,
  });
}

function context(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

function payload(playerProfileId: string, opponentProfileId: string) {
  return {
    playedAt: "2026-06-06T12:00:00.000Z",
    sideA: [{ playerProfileId, displayName: "Alice" }],
    sideB: [{ playerProfileId: opponentProfileId, displayName: "Bob" }],
    sets: [{ scoreA: 11, scoreB: 8 }],
  };
}

describe("/api/practice-matches", () => {
  beforeEach(() => {
    requirePlayerSession.mockReset();
  });

  it("requires a player session", async () => {
    requirePlayerSession.mockResolvedValue(null);

    const response = await listPracticeMatches();

    expect(response.status).toBe(401);
  });

  it("creates and lists practice matches for the signed-in player", async () => {
    const userId = new Types.ObjectId();
    const profile = await PlayerProfile.create({
      userId,
      firstName: "Alice",
      displayName: "Alice",
      email: "alice@example.com",
    });
    const opponent = await PlayerProfile.create({
      userId: new Types.ObjectId(),
      firstName: "Bob",
      displayName: "Bob",
      email: "bob@example.com",
    });
    requirePlayerSession.mockResolvedValue({
      user: {
        id: userId.toString(),
        playerProfileId: profile._id.toString(),
        role: "player",
      },
    });

    const createResponse = await createPracticeMatch(
      request(
        "http://localhost:3000/api/practice-matches",
        "POST",
        payload(profile._id.toString(), opponent._id.toString()),
      ),
    );
    const created = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(created.match).toMatchObject({
      createdBy: profile._id.toString(),
      winnerSide: "A",
      sideA: [{ playerProfileId: profile._id.toString(), displayName: "Alice" }],
    });

    const listResponse = await listPracticeMatches();
    const body = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(body.practiceMatches).toHaveLength(1);
    expect(body.practiceMatches[0]._id).toBe(created.match._id);
  });

  it("rejects invalid practice match payloads", async () => {
    const userId = new Types.ObjectId();
    const profile = await PlayerProfile.create({
      userId,
      firstName: "Alice",
      displayName: "Alice",
      email: "alice@example.com",
    });
    const opponent = await PlayerProfile.create({
      userId: new Types.ObjectId(),
      firstName: "Bob",
      displayName: "Bob",
      email: "bob@example.com",
    });
    requirePlayerSession.mockResolvedValue({
      user: {
        id: userId.toString(),
        playerProfileId: profile._id.toString(),
        role: "player",
      },
    });

    const response = await createPracticeMatch(
      request("http://localhost:3000/api/practice-matches", "POST", {
        ...payload(profile._id.toString(), opponent._id.toString()),
        sets: [{ scoreA: 11, scoreB: 10 }],
      }),
    );

    expect(response.status).toBe(422);
  });

  it("rejects practice match participants without registered player profiles", async () => {
    const userId = new Types.ObjectId();
    const profile = await PlayerProfile.create({
      userId,
      firstName: "Alice",
      displayName: "Alice",
      email: "alice@example.com",
    });
    requirePlayerSession.mockResolvedValue({
      user: {
        id: userId.toString(),
        playerProfileId: profile._id.toString(),
        role: "player",
      },
    });

    const response = await createPracticeMatch(
      request("http://localhost:3000/api/practice-matches", "POST", {
        playedAt: "2026-06-06T12:00:00.000Z",
        sideA: [{ playerProfileId: profile._id.toString(), displayName: "Alice" }],
        sideB: [{ displayName: "Unregistered Guest" }],
        sets: [{ scoreA: 11, scoreB: 8 }],
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("resolves participant display names from registered profiles and omits emails", async () => {
    const userId = new Types.ObjectId();
    const profile = await PlayerProfile.create({
      userId,
      firstName: "Alice",
      surname: "Example",
      displayName: "Alice Example",
      email: "alice@example.com",
    });
    const opponent = await PlayerProfile.create({
      userId: new Types.ObjectId(),
      firstName: "Bob",
      surname: "Builder",
      displayName: "Bob Builder",
      email: "bob@example.com",
    });
    requirePlayerSession.mockResolvedValue({
      user: {
        id: userId.toString(),
        playerProfileId: profile._id.toString(),
        role: "player",
      },
    });

    const response = await createPracticeMatch(
      request("http://localhost:3000/api/practice-matches", "POST", {
        playedAt: "2026-06-06T12:00:00.000Z",
        sideA: [
          {
            playerProfileId: profile._id.toString(),
            displayName: "Spoofed Alice",
          },
        ],
        sideB: [
          {
            playerProfileId: opponent._id.toString(),
            displayName: "Spoofed Bob",
          },
        ],
        sets: [{ scoreA: 11, scoreB: 8 }],
      }),
    );
    const body = await response.json();
    const saved = await PracticeMatch.findById(body.match._id).lean();

    expect(response.status).toBe(201);
    expect(body.match.sideA[0]).toEqual({
      playerProfileId: profile._id.toString(),
      displayName: "Alice Example",
    });
    expect(body.match.sideB[0]).toEqual({
      playerProfileId: opponent._id.toString(),
      displayName: "Bob Builder",
    });
    expect(JSON.stringify(body)).not.toContain("example.com");
    expect(saved?.sideB[0].displayName).toBe("Bob Builder");
  });

  it("prevents players from editing another creator's practice match", async () => {
    const creatorProfileId = new Types.ObjectId();
    const otherProfileId = new Types.ObjectId();
    const opponentProfileId = new Types.ObjectId();
    const match = await PracticeMatch.create({
      createdBy: creatorProfileId,
      playedAt: new Date("2026-06-06T12:00:00.000Z"),
      sideA: [{ playerProfileId: creatorProfileId, displayName: "Alice" }],
      sideB: [{ playerProfileId: opponentProfileId, displayName: "Bob" }],
      sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 }],
      winnerSide: "A",
    });
    requirePlayerSession.mockResolvedValue({
      user: {
        id: new Types.ObjectId().toString(),
        playerProfileId: otherProfileId.toString(),
        role: "player",
      },
    });

    const response = await updatePracticeMatch(
      request(
        `http://localhost:3000/api/practice-matches/${match._id}`,
        "PUT",
        payload(otherProfileId.toString(), opponentProfileId.toString()),
      ),
      context(match._id.toString()),
    );

    expect(response.status).toBe(403);
  });

  it("lets the creator update and delete their practice match", async () => {
    const creator = await PlayerProfile.create({
      userId: new Types.ObjectId(),
      firstName: "Alice",
      displayName: "Alice",
      email: "alice@example.com",
    });
    const opponent = await PlayerProfile.create({
      userId: new Types.ObjectId(),
      firstName: "Bob",
      displayName: "Bob",
      email: "bob@example.com",
    });
    const creatorProfileId = creator._id;
    const opponentProfileId = opponent._id;
    const match = await PracticeMatch.create({
      createdBy: creatorProfileId,
      playedAt: new Date("2026-06-06T12:00:00.000Z"),
      sideA: [{ playerProfileId: creatorProfileId, displayName: "Alice" }],
      sideB: [{ playerProfileId: opponentProfileId, displayName: "Bob" }],
      sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 }],
      winnerSide: "A",
    });
    requirePlayerSession.mockResolvedValue({
      user: {
        id: new Types.ObjectId().toString(),
        playerProfileId: creatorProfileId.toString(),
        role: "player",
      },
    });

    const updateResponse = await updatePracticeMatch(
      request(
        `http://localhost:3000/api/practice-matches/${match._id}`,
        "PUT",
        {
          ...payload(creatorProfileId.toString(), opponentProfileId.toString()),
          sets: [{ scoreA: 7, scoreB: 11 }],
        },
      ),
      context(match._id.toString()),
    );
    const updated = await updateResponse.json();

    expect(updateResponse.status).toBe(200);
    expect(updated.match.winnerSide).toBe("B");

    const deleteResponse = await deletePracticeMatch(
      request(`http://localhost:3000/api/practice-matches/${match._id}`, "DELETE"),
      context(match._id.toString()),
    );

    expect(deleteResponse.status).toBe(200);
    await expect(PracticeMatch.findById(match._id)).resolves.toBeNull();
  });
});
