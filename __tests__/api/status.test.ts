import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeSet, makeTeams } from "@/__tests__/helpers/factories";
import { Tournament } from "@/lib/models/Tournament";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
}));

import { PUT as updateStatus } from "@/app/api/tournaments/[id]/matches/[matchId]/status/route";

function request(
  tournamentId: string,
  matchId: string,
  body?: Record<string, unknown>,
) {
  return new NextRequest(
    `http://localhost:3000/api/tournaments/${tournamentId}/matches/${matchId}/status`,
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

describe("PUT /api/tournaments/[id]/matches/[matchId]/status", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("marks a ready match in progress and assigns the lowest free court", async () => {
    const teams = makeTeams(4);
    const liveMatch = makeMatch({
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const readyMatch = makeMatch({
      position: 2,
      status: "ready",
      teamA: { teamId: teams[2]._id, sets: [] },
      teamB: { teamId: teams[3]._id, sets: [] },
    });
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 3,
      inputMode: "teams",
      teams,
      matches: [liveMatch, readyMatch],
      currentMatchIds: [liveMatch._id],
    });

    const response = await updateStatus(
      request(tournament._id.toString(), readyMatch._id.toString(), {
        status: "in_progress",
      }),
      context(tournament._id.toString(), readyMatch._id.toString()),
    );
    const saved = await Tournament.findById(tournament._id);
    const savedMatch = saved?.matches.find(
      (match) => match._id.toString() === readyMatch._id.toString(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      matchId: readyMatch._id.toString(),
      status: "in_progress",
      courtNumber: 2,
      winnerId: null,
      loserId: null,
      tournamentCompleted: false,
      nextMatchesReady: [],
      autoStartedMatches: [],
    });
    expect(savedMatch).toMatchObject({
      status: "in_progress",
      courtNumber: 2,
    });
    expect(saved?.currentMatchIds.map((id) => id.toString())).toContain(
      readyMatch._id.toString(),
    );
  });

  it("rejects court assignment when every court is occupied", async () => {
    const teams = makeTeams(4);
    const liveMatch = makeMatch({
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const readyMatch = makeMatch({
      position: 2,
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
      matches: [liveMatch, readyMatch],
      currentMatchIds: [liveMatch._id],
    });

    const response = await updateStatus(
      request(tournament._id.toString(), readyMatch._id.toString(), {
        status: "in_progress",
      }),
      context(tournament._id.toString(), readyMatch._id.toString()),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "CONFLICT",
      error: "No courts available",
    });
  });

  it("rejects marking a pending match in progress", async () => {
    const pendingMatch = makeMatch();
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      matches: [pendingMatch],
    });

    const response = await updateStatus(
      request(tournament._id.toString(), pendingMatch._id.toString(), {
        status: "in_progress",
      }),
      context(tournament._id.toString(), pendingMatch._id.toString()),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code: "CONFLICT" });
  });

  it("confirms a match, frees its court, routes teams, and auto-starts the next ready match", async () => {
    const teams = makeTeams(4);
    const winnerTarget = makeMatch({
      round: 2,
      teamB: { teamId: teams[2]._id, sets: [] },
    });
    const loserTarget = makeMatch({
      bracket: "loser",
      teamB: { teamId: teams[3]._id, sets: [] },
    });
    const liveMatch = makeMatch({
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [makeSet(11, 9)] },
      teamB: { teamId: teams[1]._id, sets: [] },
      winnerNextMatchId: winnerTarget._id,
      winnerNextSlot: "A",
      loserNextMatchId: loserTarget._id,
      loserNextSlot: "A",
    });
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [liveMatch, winnerTarget, loserTarget],
      currentMatchIds: [liveMatch._id],
    });

    const response = await updateStatus(
      request(tournament._id.toString(), liveMatch._id.toString(), {
        status: "completed",
      }),
      context(tournament._id.toString(), liveMatch._id.toString()),
    );
    const body = await response.json();
    const saved = await Tournament.findById(tournament._id);
    const savedWinnerTarget = saved?.matches.find(
      (match) => match._id.toString() === winnerTarget._id.toString(),
    );
    const savedLoserTarget = saved?.matches.find(
      (match) => match._id.toString() === loserTarget._id.toString(),
    );

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      matchId: liveMatch._id.toString(),
      status: "completed",
      courtNumber: null,
      winnerId: teams[0]._id.toString(),
      loserId: teams[1]._id.toString(),
      tournamentCompleted: false,
    });
    expect(body.nextMatchesReady).toEqual(
      expect.arrayContaining([
        winnerTarget._id.toString(),
        loserTarget._id.toString(),
      ]),
    );
    expect(body.autoStartedMatches).toEqual([
      {
        matchId: winnerTarget._id.toString(),
        courtNumber: 1,
      },
    ]);
    expect(saved?.currentMatchIds.map((id) => id.toString())).toEqual([
      winnerTarget._id.toString(),
    ]);
    expect(savedWinnerTarget).toMatchObject({
      status: "in_progress",
      courtNumber: 1,
    });
    expect(savedLoserTarget).toMatchObject({ status: "ready" });
  });

  it("confirms a non-knockout match without routing bracket slots", async () => {
    const teams = makeTeams(4);
    const liveMatch = makeMatch({
      label: "Round 1",
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [makeSet(11, 7)] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const readyMatch = makeMatch({
      label: "Round 2",
      round: 2,
      status: "ready",
      teamA: { teamId: teams[2]._id, sets: [] },
      teamB: { teamId: teams[3]._id, sets: [] },
    });
    const tournament = await Tournament.create({
      name: "League Cup",
      format: "team_round_robin",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [liveMatch, readyMatch],
      currentMatchIds: [liveMatch._id],
    });

    const response = await updateStatus(
      request(tournament._id.toString(), liveMatch._id.toString(), {
        status: "completed",
      }),
      context(tournament._id.toString(), liveMatch._id.toString()),
    );
    const body = await response.json();
    const saved = await Tournament.findById(tournament._id);
    const savedReadyMatch = saved?.matches.find(
      (match) => match._id.toString() === readyMatch._id.toString(),
    );

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      nextMatchesReady: [],
      tournamentCompleted: false,
    });
    expect(body.autoStartedMatches).toEqual([
      {
        matchId: readyMatch._id.toString(),
        courtNumber: 1,
      },
    ]);
    expect(savedReadyMatch).toMatchObject({
      status: "in_progress",
      teamA: { teamId: teams[2]._id },
      teamB: { teamId: teams[3]._id },
    });
  });

  it("completes a non-knockout tournament after the final scheduled match", async () => {
    const teams = makeTeams(2);
    const finalMatch = makeMatch({
      label: "Round 1",
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [makeSet(11, 8)] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const tournament = await Tournament.create({
      name: "Small League",
      format: "team_round_robin",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [finalMatch],
      currentMatchIds: [finalMatch._id],
    });

    const response = await updateStatus(
      request(tournament._id.toString(), finalMatch._id.toString(), {
        status: "completed",
      }),
      context(tournament._id.toString(), finalMatch._id.toString()),
    );
    const body = await response.json();
    const saved = await Tournament.findById(tournament._id);

    expect(response.status).toBe(200);
    expect(body.tournamentCompleted).toBe(true);
    expect(saved?.status).toBe("completed");
  });

  it.each([
    ["without scores", []],
    ["with an undetermined BO3 winner", [makeSet(11, 9)]],
  ])("rejects completion %s", async (_label, sets) => {
    const teams = makeTeams(2);
    const liveMatch = makeMatch({
      format: "bo3",
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [liveMatch],
      currentMatchIds: [liveMatch._id],
    });

    const response = await updateStatus(
      request(tournament._id.toString(), liveMatch._id.toString(), {
        status: "completed",
      }),
      context(tournament._id.toString(), liveMatch._id.toString()),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("completes the tournament when its final match is confirmed", async () => {
    const teams = makeTeams(2);
    const final = makeMatch({
      label: "WB Final",
      format: "bo3",
      status: "in_progress",
      courtNumber: 1,
      isWBFinal: true,
      teamA: {
        teamId: teams[0]._id,
        sets: [makeSet(11, 9), makeSet(11, 8)],
      },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [final],
      currentMatchIds: [final._id],
    });

    const response = await updateStatus(
      request(tournament._id.toString(), final._id.toString(), {
        status: "completed",
      }),
      context(tournament._id.toString(), final._id.toString()),
    );
    const body = await response.json();
    const saved = await Tournament.findById(tournament._id);

    expect(response.status).toBe(200);
    expect(body.tournamentCompleted).toBe(true);
    expect(body.autoStartedMatches).toEqual([]);
    expect(saved?.status).toBe("completed");
  });

  it("completes a winner-only match when a winner side is selected", async () => {
    const teams = makeTeams(2);
    const final = makeMatch({
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const tournament = await Tournament.create({
      name: "Winner Only Cup",
      status: "active",
      matchResultMode: "winner_only",
      knockoutMatchFormat: "bo1",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [final],
      currentMatchIds: [final._id],
    });

    const response = await updateStatus(
      request(tournament._id.toString(), final._id.toString(), {
        status: "completed",
        winnerSide: "B",
      }),
      context(tournament._id.toString(), final._id.toString()),
    );
    const body = await response.json();
    const saved = await Tournament.findById(tournament._id);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "completed",
      winnerId: teams[1]._id.toString(),
      loserId: teams[0]._id.toString(),
      tournamentCompleted: true,
    });
    expect(saved?.matches[0].teamA?.sets).toEqual([]);
    expect(saved?.matches[0].teamB?.sets).toEqual([]);
  });

  it("rejects winner-only completion for point-scored tournaments", async () => {
    const teams = makeTeams(2);
    const final = makeMatch({
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const tournament = await Tournament.create({
      name: "Point Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [final],
      currentMatchIds: [final._id],
    });

    const response = await updateStatus(
      request(tournament._id.toString(), final._id.toString(), {
        status: "completed",
        winnerSide: "A",
      }),
      context(tournament._id.toString(), final._id.toString()),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
      error: "Winner-only completion is not enabled",
    });
  });

  it("rejects winner-only completion without a selected side", async () => {
    const teams = makeTeams(2);
    const final = makeMatch({
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const tournament = await Tournament.create({
      name: "Winner Only Cup",
      status: "active",
      matchResultMode: "winner_only",
      knockoutMatchFormat: "bo1",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [final],
      currentMatchIds: [final._id],
    });

    const response = await updateStatus(
      request(tournament._id.toString(), final._id.toString(), {
        status: "completed",
      }),
      context(tournament._id.toString(), final._id.toString()),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
      error: "Winner side is required",
    });
  });

  it("returns 404 for an unknown match", async () => {
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
    });
    const matchId = new Types.ObjectId().toString();

    const response = await updateStatus(
      request(tournament._id.toString(), matchId, {
        status: "in_progress",
      }),
      context(tournament._id.toString(), matchId),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns 404 for malformed ids", async () => {
    const response = await updateStatus(
      request("invalid", "invalid", {
        status: "in_progress",
      }),
      context("invalid", "invalid"),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects unsupported status values", async () => {
    const tournamentId = new Types.ObjectId().toString();
    const matchId = new Types.ObjectId().toString();

    const response = await updateStatus(
      request(tournamentId, matchId, {
        status: "ready",
      }),
      context(tournamentId, matchId),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects completion when the match is not in progress", async () => {
    const readyMatch = makeMatch({ status: "ready" });
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      matches: [readyMatch],
    });

    const response = await updateStatus(
      request(tournament._id.toString(), readyMatch._id.toString(), {
        status: "completed",
      }),
      context(tournament._id.toString(), readyMatch._id.toString()),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects completion without both teams", async () => {
    const [team] = makeTeams(1);
    const liveMatch = makeMatch({
      status: "in_progress",
      teamA: { teamId: team._id, sets: [makeSet(11, 9)] },
    });
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams: [team],
      matches: [liveMatch],
      currentMatchIds: [liveMatch._id],
    });

    const response = await updateStatus(
      request(tournament._id.toString(), liveMatch._id.toString(), {
        status: "completed",
      }),
      context(tournament._id.toString(), liveMatch._id.toString()),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects malformed request bodies", async () => {
    const tournamentId = new Types.ObjectId().toString();
    const matchId = new Types.ObjectId().toString();

    const response = await updateStatus(
      request(tournamentId, matchId),
      context(tournamentId, matchId),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("requires an authenticated admin", async () => {
    requireAdmin.mockResolvedValue(false);
    const tournamentId = new Types.ObjectId().toString();
    const matchId = new Types.ObjectId().toString();

    const response = await updateStatus(
      request(tournamentId, matchId, {
        status: "in_progress",
      }),
      context(tournamentId, matchId),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
