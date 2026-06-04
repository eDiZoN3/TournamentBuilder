import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { Tournament } from "@/lib/models/Tournament";

const { requirePlayerSession } = vi.hoisted(() => ({
  requirePlayerSession: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requirePlayerSession,
}));

import { POST as joinTournament } from "@/app/api/tournaments/[id]/join/route";

function request(id: string) {
  return new NextRequest(`http://localhost:3000/api/tournaments/${id}/join`, {
    method: "POST",
  });
}

function context(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

describe("POST /api/tournaments/[id]/join", () => {
  beforeEach(() => {
    requirePlayerSession.mockReset();
  });

  it("lets a player join a draft self-join tournament", async () => {
    const userId = new Types.ObjectId();
    const profile = await PlayerProfile.create({
      userId,
      firstName: "Alice",
      surname: "Example",
      displayName: "Alice Example",
      email: "alice@example.com",
    });
    const tournament = await Tournament.create({
      name: "Join Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "players",
      allowSelfJoin: true,
    });
    requirePlayerSession.mockResolvedValue({
      user: {
        id: userId.toString(),
        playerProfileId: profile._id.toString(),
        role: "player",
      },
    });

    const response = await joinTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.player).toMatchObject({
      displayName: "Alice Example",
      email: "alice@example.com",
    });
    expect(body.joinedPlayerCount).toBe(1);
    expect(body.joinedPlayers).toEqual([
      expect.objectContaining({
        displayName: "Alice Example",
        email: "alice@example.com",
      }),
    ]);

    const updated = await Tournament.findById(tournament._id);

    expect(updated?.joinedPlayers).toHaveLength(1);
    expect(updated?.joinedPlayers[0].userId.toString()).toBe(userId.toString());
  });

  it("rejects duplicate joins", async () => {
    const userId = new Types.ObjectId();
    const profile = await PlayerProfile.create({
      userId,
      firstName: "Alice",
      displayName: "Alice",
      email: "alice@example.com",
    });
    const tournament = await Tournament.create({
      name: "Join Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "players",
      allowSelfJoin: true,
      joinedPlayers: [
        {
          userId,
          playerProfileId: profile._id,
          firstName: "Alice",
          displayName: "Alice",
          email: "alice@example.com",
          joinedAt: new Date(),
        },
      ],
    });
    requirePlayerSession.mockResolvedValue({
      user: {
        id: userId.toString(),
        playerProfileId: profile._id.toString(),
        role: "player",
      },
    });

    const response = await joinTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(409);
  });

  it("rejects joins after the tournament has started", async () => {
    const userId = new Types.ObjectId();
    const profile = await PlayerProfile.create({
      userId,
      firstName: "Alice",
      displayName: "Alice",
      email: "alice@example.com",
    });
    const tournament = await Tournament.create({
      name: "Join Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "players",
      allowSelfJoin: true,
    });
    requirePlayerSession.mockResolvedValue({
      user: {
        id: userId.toString(),
        playerProfileId: profile._id.toString(),
        role: "player",
      },
    });

    const response = await joinTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(409);
  });

  it("requires a player session", async () => {
    requirePlayerSession.mockResolvedValue(null);

    const response = await joinTournament(
      request(new Types.ObjectId().toString()),
      context(new Types.ObjectId().toString()),
    );

    expect(response.status).toBe(401);
  });
});
