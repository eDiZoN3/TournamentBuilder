import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TournamentGroup } from "@/lib/models/TournamentGroup";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
}));

import { PUT as setTeams } from "@/app/api/groups/[id]/teams/route";
import { Types } from "mongoose";

function request(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("PUT /api/groups/[id]/teams", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("replaces the teams array and assigns seeds 1..N", async () => {
    const group = await TournamentGroup.create({ name: "Cup" });

    const res = await setTeams(
      request(`http://localhost/api/groups/${group._id}/teams`, {
        teams: [
          { name: "Alpha", players: ["Alice", "Bob"] },
          { name: "Beta", players: ["Carol"] },
          { name: "Gamma", players: [] },
        ],
      }),
      ctx(group._id.toString()),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.teams).toHaveLength(3);
    expect(body.teams[0]).toMatchObject({ name: "Alpha", seed: 1 });
    expect(body.teams[1]).toMatchObject({ name: "Beta", seed: 2 });
    expect(body.teams[2]).toMatchObject({ name: "Gamma", seed: 3 });
  });

  it("replaces existing teams with new roster", async () => {
    const group = await TournamentGroup.create({
      name: "Cup",
      teams: [{ name: "Old Team", players: [], seed: 1 }],
    });

    const res = await setTeams(
      request(`http://localhost/api/groups/${group._id}/teams`, {
        teams: [
          { name: "New A", players: [] },
          { name: "New B", players: [] },
        ],
      }),
      ctx(group._id.toString()),
    );
    const body = await res.json();

    expect(body.teams).toHaveLength(2);
    expect(body.teams[0].name).toBe("New A");
  });

  it("returns 400 when fewer than 2 teams are provided", async () => {
    const group = await TournamentGroup.create({ name: "Cup" });

    const res = await setTeams(
      request(`http://localhost/api/groups/${group._id}/teams`, {
        teams: [{ name: "Solo", players: [] }],
      }),
      ctx(group._id.toString()),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when teams array is empty", async () => {
    const group = await TournamentGroup.create({ name: "Cup" });

    const res = await setTeams(
      request(`http://localhost/api/groups/${group._id}/teams`, { teams: [] }),
      ctx(group._id.toString()),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when teams field is missing", async () => {
    const group = await TournamentGroup.create({ name: "Cup" });

    const res = await setTeams(
      request(`http://localhost/api/groups/${group._id}/teams`, {}),
      ctx(group._id.toString()),
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 when group is not draft", async () => {
    const group = await TournamentGroup.create({
      name: "Cup",
      status: "active",
    });

    const res = await setTeams(
      request(`http://localhost/api/groups/${group._id}/teams`, {
        teams: [
          { name: "A", players: [] },
          { name: "B", players: [] },
        ],
      }),
      ctx(group._id.toString()),
    );
    expect(res.status).toBe(409);
  });

  it("returns 404 for unknown group", async () => {
    const res = await setTeams(
      request(`http://localhost/api/groups/${new Types.ObjectId()}/teams`, {
        teams: [
          { name: "A", players: [] },
          { name: "B", players: [] },
        ],
      }),
      ctx(new Types.ObjectId().toString()),
    );
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    requireAdmin.mockResolvedValue(false);
    const group = await TournamentGroup.create({ name: "Cup" });

    const res = await setTeams(
      request(`http://localhost/api/groups/${group._id}/teams`, {
        teams: [
          { name: "A", players: [] },
          { name: "B", players: [] },
        ],
      }),
      ctx(group._id.toString()),
    );
    expect(res.status).toBe(401);
  });
});
