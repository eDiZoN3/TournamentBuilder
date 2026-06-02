import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeTeams } from "@/__tests__/helpers/factories";
import { Tournament } from "@/lib/models/Tournament";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
}));

import { PUT as overrideCourt } from "@/app/api/tournaments/[id]/matches/[matchId]/court/route";

function request(
  tournamentId: string,
  matchId: string,
  body?: Record<string, unknown>,
) {
  return new NextRequest(
    `http://localhost:3000/api/tournaments/${tournamentId}/matches/${matchId}/court`,
    {
      method: "PUT",
      body: body ? JSON.stringify(body) : "{",
      headers: {
        "content-type": "application/json",
      },
    },
  );
}

function context(id: string, matchId: string) {
  return {
    params: Promise.resolve({ id, matchId }),
  };
}

describe("PUT /api/tournaments/[id]/matches/[matchId]/court", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("assigns a ready match to a selected free court", async () => {
    const teams = makeTeams(4);
    const live = makeMatch({
      status: "in_progress",
      courtNumber: 2,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const ready = makeMatch({
      status: "ready",
      teamA: { teamId: teams[2]._id, sets: [] },
      teamB: { teamId: teams[3]._id, sets: [] },
    });
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 2,
      inputMode: "teams",
      teams,
      matches: [live, ready],
      currentMatchIds: [live._id],
    });

    const response = await overrideCourt(
      request(tournament._id.toString(), ready._id.toString(), {
        courtNumber: 1,
      }),
      context(tournament._id.toString(), ready._id.toString()),
    );
    const saved = await Tournament.findById(tournament._id);
    const savedReady = saved?.matches.find(
      (match) => match._id.toString() === ready._id.toString(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      matchId: ready._id.toString(),
      status: "in_progress",
      courtNumber: 1,
      replacedMatchId: null,
    });
    expect(savedReady).toMatchObject({
      status: "in_progress",
      courtNumber: 1,
    });
  });

  it("replaces the match currently occupying the selected court", async () => {
    const teams = makeTeams(4);
    const live = makeMatch({
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const ready = makeMatch({
      status: "ready",
      teamA: { teamId: teams[2]._id, sets: [] },
      teamB: { teamId: teams[3]._id, sets: [] },
    });
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [live, ready],
      currentMatchIds: [live._id],
    });

    const response = await overrideCourt(
      request(tournament._id.toString(), ready._id.toString(), {
        courtNumber: 1,
      }),
      context(tournament._id.toString(), ready._id.toString()),
    );
    const saved = await Tournament.findById(tournament._id);
    const savedLive = saved?.matches.find(
      (match) => match._id.toString() === live._id.toString(),
    );
    const savedReady = saved?.matches.find(
      (match) => match._id.toString() === ready._id.toString(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      matchId: ready._id.toString(),
      courtNumber: 1,
      replacedMatchId: live._id.toString(),
    });
    expect(savedLive).toMatchObject({ status: "ready", courtNumber: null });
    expect(savedReady).toMatchObject({
      status: "in_progress",
      courtNumber: 1,
    });
    expect(saved?.currentMatchIds.map((id) => id.toString())).toEqual([
      ready._id.toString(),
    ]);
  });

  it("moves an in-progress match to another free court", async () => {
    const teams = makeTeams(2);
    const live = makeMatch({
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 2,
      inputMode: "teams",
      teams,
      matches: [live],
      currentMatchIds: [live._id],
    });

    const response = await overrideCourt(
      request(tournament._id.toString(), live._id.toString(), {
        courtNumber: 2,
      }),
      context(tournament._id.toString(), live._id.toString()),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      matchId: live._id.toString(),
      courtNumber: 2,
      replacedMatchId: null,
    });
  });

  it("rejects invalid courts and non-playable matches", async () => {
    const completed = makeMatch({ status: "completed" });
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      matches: [completed],
    });

    const invalidCourt = await overrideCourt(
      request(tournament._id.toString(), completed._id.toString(), {
        courtNumber: 2,
      }),
      context(tournament._id.toString(), completed._id.toString()),
    );
    const completedResponse = await overrideCourt(
      request(tournament._id.toString(), completed._id.toString(), {
        courtNumber: 1,
      }),
      context(tournament._id.toString(), completed._id.toString()),
    );

    expect(invalidCourt.status).toBe(422);
    expect(completedResponse.status).toBe(409);
  });

  it("requires an authenticated admin", async () => {
    requireAdmin.mockResolvedValue(false);
    const tournamentId = new Types.ObjectId().toString();
    const matchId = new Types.ObjectId().toString();

    const response = await overrideCourt(
      request(tournamentId, matchId, {
        courtNumber: 1,
      }),
      context(tournamentId, matchId),
    );

    expect(response.status).toBe(401);
  });
});
