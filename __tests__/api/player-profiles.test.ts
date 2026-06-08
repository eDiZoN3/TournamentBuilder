import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerProfile } from "@/lib/models/PlayerProfile";

const { requireAuthenticatedSession } = vi.hoisted(() => ({
  requireAuthenticatedSession: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAuthenticatedSession,
}));

import { GET as searchPlayerProfiles } from "@/app/api/player-profiles/route";

function request(query = "") {
  return new NextRequest(`http://localhost:3000/api/player-profiles${query}`);
}

describe("/api/player-profiles", () => {
  beforeEach(() => {
    requireAuthenticatedSession.mockReset();
    requireAuthenticatedSession.mockResolvedValue({
      user: {
        id: new Types.ObjectId().toString(),
        role: "tournament_lead",
      },
    });
  });

  it("requires an authenticated account", async () => {
    requireAuthenticatedSession.mockResolvedValue(null);

    const response = await searchPlayerProfiles(request("?q=ali"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("searches registered players and does not expose emails", async () => {
    const alice = await PlayerProfile.create({
      userId: new Types.ObjectId(),
      firstName: "Alice",
      surname: "Example",
      displayName: "Alice Example",
      email: "alice@example.com",
    });
    await PlayerProfile.create({
      userId: new Types.ObjectId(),
      firstName: "Bob",
      surname: "Builder",
      displayName: "Bob Builder",
      email: "bob@example.com",
    });

    const response = await searchPlayerProfiles(request("?q=ali"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.players).toEqual([
      {
        _id: alice._id.toString(),
        firstName: "Alice",
        surname: "Example",
        displayName: "Alice Example",
      },
    ]);
    expect(JSON.stringify(body)).not.toContain("alice@example.com");
  });

  it("limits and sorts search results deterministically", async () => {
    await PlayerProfile.create([
      {
        userId: new Types.ObjectId(),
        firstName: "Charlie",
        displayName: "Charlie",
        email: "charlie@example.com",
      },
      {
        userId: new Types.ObjectId(),
        firstName: "Alice",
        displayName: "Alice",
        email: "alice@example.com",
      },
      {
        userId: new Types.ObjectId(),
        firstName: "Aaron",
        displayName: "Aaron",
        email: "aaron@example.com",
      },
    ]);

    const response = await searchPlayerProfiles(request("?q=a&limit=2"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.players.map((player: { displayName: string }) => player.displayName)).toEqual([
      "Aaron",
      "Alice",
    ]);
  });
});
