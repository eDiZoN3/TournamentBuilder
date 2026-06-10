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

import { POST as overrideMatch } from "@/app/api/tournaments/[id]/matches/[matchId]/override/route";

function request(
  tournamentId: string,
  matchId: string,
  body?: Record<string, unknown>,
) {
  return new NextRequest(
    `http://localhost:3000/api/tournaments/${tournamentId}/matches/${matchId}/override`,
    {
      method: "POST",
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

async function createCompletedTournament() {
  const teams = makeTeams(3);
  const downstream = makeMatch({
    round: 2,
    position: 1,
    status: "completed",
    courtNumber: 1,
    teamA: { teamId: teams[0]._id, sets: [makeSet(11, 8)] },
    teamB: { teamId: teams[2]._id, sets: [] },
    winnerId: teams[0]._id,
    loserId: teams[2]._id,
  });
  const source = makeMatch({
    status: "completed",
    teamA: { teamId: teams[0]._id, sets: [makeSet(11, 9)] },
    teamB: { teamId: teams[1]._id, sets: [] },
    winnerId: teams[0]._id,
    loserId: teams[1]._id,
    winnerNextMatchId: downstream._id,
    winnerNextSlot: "A",
  });
  const tournament = await Tournament.create({
    name: "Summer Cup",
    status: "completed",
    teamSize: 2,
    courtsAvailable: 1,
    inputMode: "teams",
    teams,
    matches: [source, downstream],
    currentMatchIds: [downstream._id],
  });

  return {
    teams,
    tournament,
    source: tournament.matches[0],
    downstream: tournament.matches[1],
  };
}

describe("POST /api/tournaments/[id]/matches/[matchId]/override", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("updates completed-match scores when the winner stays the same", async () => {
    const { tournament, source, teams } = await createCompletedTournament();

    const response = await overrideMatch(
      request(tournament._id.toString(), source._id.toString(), {
        sets: [makeSet(21, 19)],
      }),
      context(tournament._id.toString(), source._id.toString()),
    );
    const saved = await Tournament.findById(tournament._id);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      matchId: source._id.toString(),
      winnerChanged: false,
      affectedMatchIds: [],
      tournamentStatus: "completed",
    });
    expect(saved?.matches[0]).toMatchObject({
      status: "completed",
      winnerId: teams[0]._id,
      loserId: teams[1]._id,
    });
    expect(saved?.matches[0].teamA?.sets).toMatchObject([
      { scoreA: 21, scoreB: 19, pointsToWin: 21 },
    ]);
  });

  it("changes the winner, clears downstream state, and reopens the tournament", async () => {
    const { tournament, source, downstream, teams } =
      await createCompletedTournament();

    const response = await overrideMatch(
      request(tournament._id.toString(), source._id.toString(), {
        sets: [makeSet(9, 11)],
        reason: "Wrong winner selected",
      }),
      context(tournament._id.toString(), source._id.toString()),
    );
    const body = await response.json();
    const saved = await Tournament.findById(tournament._id);
    const savedSource = saved?.matches.find(
      (match) => match._id.toString() === source._id.toString(),
    );
    const savedDownstream = saved?.matches.find(
      (match) => match._id.toString() === downstream._id.toString(),
    );

    expect(response.status).toBe(200);
    expect(body).toEqual({
      matchId: source._id.toString(),
      winnerChanged: true,
      affectedMatchIds: [downstream._id.toString()],
      tournamentStatus: "active",
    });
    expect(savedSource).toMatchObject({
      status: "completed",
      winnerId: teams[1]._id,
      loserId: teams[0]._id,
    });
    expect(savedDownstream).toMatchObject({
      status: "ready",
      courtNumber: null,
      winnerId: null,
      loserId: null,
    });
    expect(savedDownstream?.teamA?.teamId).toEqual(teams[1]._id);
    expect(savedDownstream?.teamA?.sets).toEqual([]);
    expect(savedDownstream?.teamB?.teamId).toEqual(teams[2]._id);
    expect(saved?.currentMatchIds).toEqual([]);
    expect(saved?.status).toBe("active");
  });

  it("overrides a completed winner-only match by selected winner side", async () => {
    const teams = makeTeams(3);
    const downstream = makeMatch({
      round: 2,
      status: "completed",
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[2]._id, sets: [] },
      winnerId: teams[0]._id,
      loserId: teams[2]._id,
    });
    const source = makeMatch({
      status: "completed",
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
      winnerId: teams[0]._id,
      loserId: teams[1]._id,
      winnerNextMatchId: downstream._id,
      winnerNextSlot: "A",
    });
    const tournament = await Tournament.create({
      name: "Winner Only Cup",
      status: "completed",
      matchResultMode: "winner_only",
      knockoutMatchFormat: "bo1",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [source, downstream],
    });

    const response = await overrideMatch(
      request(tournament._id.toString(), source._id.toString(), {
        winnerSide: "B",
      }),
      context(tournament._id.toString(), source._id.toString()),
    );
    const body = await response.json();
    const saved = await Tournament.findById(tournament._id);

    expect(response.status).toBe(200);
    expect(body).toEqual({
      matchId: source._id.toString(),
      winnerChanged: true,
      affectedMatchIds: [downstream._id.toString()],
      tournamentStatus: "active",
    });
    expect(saved?.matches[0]).toMatchObject({
      status: "completed",
      winnerId: teams[1]._id,
      loserId: teams[0]._id,
    });
    expect(saved?.matches[0].teamA?.sets).toEqual([]);
    expect(saved?.matches[0].teamB?.sets).toEqual([]);
    expect(saved?.matches[1]).toMatchObject({
      status: "ready",
      teamA: { teamId: teams[1]._id, sets: [] },
      teamB: { teamId: teams[2]._id, sets: [] },
      winnerId: null,
      loserId: null,
    });
  });

  it("rejects invalid override scores", async () => {
    const { tournament, source } = await createCompletedTournament();

    const response = await overrideMatch(
      request(tournament._id.toString(), source._id.toString(), {
        sets: [{ scoreA: 11, scoreB: 10, pointsToWin: 11 }],
      }),
      context(tournament._id.toString(), source._id.toString()),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
      error: "Winner must lead by at least 2 points",
    });
  });

  it("rejects overrides for matches that are not completed", async () => {
    const teams = makeTeams(2);
    const match = makeMatch({
      status: "in_progress",
      teamA: { teamId: teams[0]._id, sets: [makeSet(11, 9)] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [match],
    });

    const response = await overrideMatch(
      request(tournament._id.toString(), match._id.toString(), {
        sets: [makeSet(9, 11)],
      }),
      context(tournament._id.toString(), match._id.toString()),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("requires an authenticated admin", async () => {
    requireAdmin.mockResolvedValue(false);
    const tournamentId = new Types.ObjectId().toString();
    const matchId = new Types.ObjectId().toString();

    const response = await overrideMatch(
      request(tournamentId, matchId, {
        sets: [makeSet(11, 9)],
      }),
      context(tournamentId, matchId),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
