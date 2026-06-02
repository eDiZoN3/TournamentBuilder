import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTeams } from "@/__tests__/helpers/factories";
import { Tournament } from "@/lib/models/Tournament";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
}));

import { POST as startTournament } from "@/app/api/tournaments/[id]/start/route";

function request(id: string) {
  return new NextRequest(`http://localhost:3000/api/tournaments/${id}/start`, {
    method: "POST",
  });
}

function context(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

describe("POST /api/tournaments/[id]/start", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
    vi.spyOn(Math, "random").mockReturnValue(0.999);
  });

  it.each([
    [4, 4],
    [8, 12],
  ])("persists a generated bracket for %i teams", async (teamCount, matchesGenerated) => {
    const tournament = await Tournament.create({
      name: "Summer Cup",
      teamSize: 2,
      courtsAvailable: 2,
      inputMode: "teams",
      teams: makeTeams(teamCount),
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );
    const body = await response.json();
    const savedTournament = await Tournament.findById(tournament._id);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      tournamentId: tournament._id.toString(),
      matchesGenerated,
      byeCount: 0,
    });
    expect(body.autoStartedMatches).toHaveLength(2);
    expect(savedTournament).toMatchObject({
      status: "active",
      matches: expect.any(Array),
    });
    expect(savedTournament?.matches).toHaveLength(matchesGenerated);
    expect(savedTournament?.currentMatchIds).toHaveLength(2);
  });

  it("persists byes for a padded 3-team bracket", async () => {
    const tournament = await Tournament.create({
      name: "Small Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams: makeTeams(3),
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      matchesGenerated: 4,
      byeCount: 2,
    });
    expect(body.autoStartedMatches).toHaveLength(1);
  });

  it("rejects an already-active tournament", async () => {
    const tournament = await Tournament.create({
      name: "Started Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams: makeTeams(4),
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects tournaments with fewer than two teams", async () => {
    const tournament = await Tournament.create({
      name: "Small Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams: makeTeams(1),
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects undersized player-mode teams", async () => {
    const tournament = await Tournament.create({
      name: "Player Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "players",
      teams: [
        { name: "Alpha", players: ["One"], seed: 0 },
        { name: "Beta", players: ["Two", "Three"], seed: 0 },
      ],
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("returns 404 for an unknown tournament", async () => {
    const id = new Types.ObjectId().toString();
    const response = await startTournament(request(id), context(id));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: "NOT_FOUND" });
  });

  it("requires an authenticated admin", async () => {
    requireAdmin.mockResolvedValue(false);
    const id = new Types.ObjectId().toString();

    const response = await startTournament(request(id), context(id));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
