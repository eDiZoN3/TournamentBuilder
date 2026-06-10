import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TournamentGroup } from "@/lib/models/TournamentGroup";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
}));

import { POST as startGroup } from "@/app/api/groups/[id]/start/route";

function request(id: string) {
  return new NextRequest(`http://localhost/api/groups/${id}/start`, {
    method: "POST",
  });
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function teams(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    _id: new Types.ObjectId(),
    name: `Team ${i + 1}`,
    players: [],
    seed: i + 1,
  }));
}

describe("POST /api/groups/[id]/start", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  it("generates brackets for each category and sets group to active", async () => {
    // 4 teams single-elimination → 3 matches per category (bracketSize=4, rounds=2)
    const group = await TournamentGroup.create({
      name: "Cup",
      teams: teams(4),
      categories: [
        { name: "Cat A", position: 0 },
        { name: "Cat B", position: 1 },
      ],
    });

    const res = await startGroup(request(group._id.toString()), ctx(group._id.toString()));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("active");
    expect(body.categories[0].matches).toHaveLength(3);
    expect(body.categories[1].matches).toHaveLength(3);
  });

  it("sets the first ready match in each category to in_progress on start", async () => {
    const group = await TournamentGroup.create({
      name: "Cup",
      teams: teams(4),
      categories: [{ name: "Cat A", position: 0 }],
    });

    const res = await startGroup(request(group._id.toString()), ctx(group._id.toString()));
    const body = await res.json();

    expect(res.status).toBe(200);
    const inProgress = body.categories[0].matches.filter(
      (m: { status: string }) => m.status === "in_progress",
    );
    expect(inProgress).toHaveLength(1);
  });

  it("respects team conflict constraint across categories on start", async () => {
    // With 2 teams and 2 categories: both categories have the same teams in their final
    // Only one category can be started (the higher-priority one)
    const group = await TournamentGroup.create({
      name: "Cup",
      teams: teams(2),
      categories: [
        { name: "Cat A", position: 0 },
        { name: "Cat B", position: 1 },
      ],
    });

    const res = await startGroup(request(group._id.toString()), ctx(group._id.toString()));
    const body = await res.json();

    expect(res.status).toBe(200);

    const allInProgress = body.categories.flatMap((cat: { matches: { status: string }[] }) =>
      cat.matches.filter((m) => m.status === "in_progress"),
    );
    // Only 1 match can be in_progress because both cats share the same 2 teams
    expect(allInProgress).toHaveLength(1);
  });

  it("returns 400 when group has no teams", async () => {
    const group = await TournamentGroup.create({
      name: "Cup",
      categories: [{ name: "Cat A", position: 0 }],
    });

    const res = await startGroup(request(group._id.toString()), ctx(group._id.toString()));
    expect(res.status).toBe(400);
  });

  it("returns 400 when group has fewer than 2 teams", async () => {
    const group = await TournamentGroup.create({
      name: "Cup",
      teams: teams(1),
      categories: [{ name: "Cat A", position: 0 }],
    });

    const res = await startGroup(request(group._id.toString()), ctx(group._id.toString()));
    expect(res.status).toBe(400);
  });

  it("returns 400 when group has no categories", async () => {
    const group = await TournamentGroup.create({
      name: "Cup",
      teams: teams(4),
    });

    const res = await startGroup(request(group._id.toString()), ctx(group._id.toString()));
    expect(res.status).toBe(400);
  });

  it("returns 409 when group is already active", async () => {
    const group = await TournamentGroup.create({
      name: "Cup",
      status: "active",
      teams: teams(4),
      categories: [{ name: "Cat A", position: 0 }],
    });

    const res = await startGroup(request(group._id.toString()), ctx(group._id.toString()));
    expect(res.status).toBe(409);
  });

  it("returns 404 for a non-existent group", async () => {
    const res = await startGroup(
      request(new Types.ObjectId().toString()),
      ctx(new Types.ObjectId().toString()),
    );
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    requireAdmin.mockResolvedValue(false);
    const group = await TournamentGroup.create({
      name: "Cup",
      teams: teams(4),
      categories: [{ name: "Cat A", position: 0 }],
    });

    const res = await startGroup(request(group._id.toString()), ctx(group._id.toString()));
    expect(res.status).toBe(401);
  });
});
