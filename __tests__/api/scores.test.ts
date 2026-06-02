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

import { PUT as saveScore } from "@/app/api/tournaments/[id]/matches/[matchId]/scores/route";

function request(
  tournamentId: string,
  matchId: string,
  body?: Record<string, unknown>,
) {
  return new NextRequest(
    `http://localhost:3000/api/tournaments/${tournamentId}/matches/${matchId}/scores`,
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

async function createTournamentWithMatch(
  overrides: Parameters<typeof makeMatch>[0] = {},
) {
  const teams = makeTeams(2);
  const tournament = await Tournament.create({
    name: "Summer Cup",
    status: "active",
    teamSize: 2,
    courtsAvailable: 1,
    inputMode: "teams",
    teams,
    matches: [
      makeMatch({
        status: "in_progress",
        teamA: { teamId: teams[0]._id, sets: [] },
        teamB: { teamId: teams[1]._id, sets: [] },
        ...overrides,
      }),
    ],
  });

  return {
    teams,
    tournament,
    match: tournament.matches[0],
  };
}

describe("PUT /api/tournaments/[id]/matches/[matchId]/scores", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("accepts a valid set and returns its derived scoring details", async () => {
    const { tournament, match } = await createTournamentWithMatch({
      format: "bo3",
    });

    const response = await saveScore(
      request(tournament._id.toString(), match._id.toString(), {
        setIndex: 0,
        scoreA: 21,
        scoreB: 19,
      }),
      context(tournament._id.toString(), match._id.toString()),
    );
    const saved = await Tournament.findById(tournament._id);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      setIndex: 0,
      pointsToWin: 21,
      setWinner: "A",
      sets: [{ scoreA: 21, scoreB: 19, pointsToWin: 21 }],
      matchWinner: null,
      clearedSets: 0,
    });
    expect(saved?.matches[0].teamA?.sets).toMatchObject([
      { scoreA: 21, scoreB: 19, pointsToWin: 21 },
    ]);
  });

  it("rejects an invalid volleyball score", async () => {
    const { tournament, match } = await createTournamentWithMatch();

    const response = await saveScore(
      request(tournament._id.toString(), match._id.toString(), {
        setIndex: 0,
        scoreA: 11,
        scoreB: 10,
      }),
      context(tournament._id.toString(), match._id.toString()),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
      error: "Winner must lead by at least 2 points",
    });
  });

  it.each([
    ["an out-of-bounds BO3 set", { setIndex: 3, scoreA: 11, scoreB: 9 }],
    ["a skipped set", { setIndex: 1, scoreA: 11, scoreB: 9 }],
  ])("rejects %s", async (_label, body) => {
    const { tournament, match } = await createTournamentWithMatch({
      format: "bo3",
    });

    const response = await saveScore(
      request(tournament._id.toString(), match._id.toString(), body),
      context(tournament._id.toString(), match._id.toString()),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("clears subsequent sets when a prior set is re-entered", async () => {
    const { tournament, match } = await createTournamentWithMatch({
      format: "bo3",
      teamA: {
        teamId: makeTeams(1)[0]._id,
        sets: [makeSet(11, 9), makeSet(9, 11), makeSet(15, 13)],
      },
    });

    const response = await saveScore(
      request(tournament._id.toString(), match._id.toString(), {
        setIndex: 0,
        scoreA: 9,
        scoreB: 11,
      }),
      context(tournament._id.toString(), match._id.toString()),
    );
    const body = await response.json();
    const saved = await Tournament.findById(tournament._id);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      clearedSets: 2,
      matchWinner: null,
      sets: [{ scoreA: 9, scoreB: 11, pointsToWin: 11 }],
    });
    expect(saved?.matches[0].teamA?.sets).toHaveLength(1);
  });

  it("restricts BO1 matches to the first set", async () => {
    const { tournament, match } = await createTournamentWithMatch({
      format: "bo1",
      teamA: {
        teamId: makeTeams(1)[0]._id,
        sets: [makeSet(11, 9)],
      },
    });

    const response = await saveScore(
      request(tournament._id.toString(), match._id.toString(), {
        setIndex: 1,
        scoreA: 11,
        scoreB: 9,
      }),
      context(tournament._id.toString(), match._id.toString()),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it.each(["pending", "completed"] as const)(
    "rejects score entry for a %s match",
    async (status) => {
      const { tournament, match } = await createTournamentWithMatch({ status });

      const response = await saveScore(
        request(tournament._id.toString(), match._id.toString(), {
          setIndex: 0,
          scoreA: 11,
          scoreB: 9,
        }),
        context(tournament._id.toString(), match._id.toString()),
      );

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({
        code: "CONFLICT",
      });
    },
  );

  it("returns 404 for an unknown match", async () => {
    const { tournament } = await createTournamentWithMatch();
    const matchId = new Types.ObjectId().toString();

    const response = await saveScore(
      request(tournament._id.toString(), matchId, {
        setIndex: 0,
        scoreA: 11,
        scoreB: 9,
      }),
      context(tournament._id.toString(), matchId),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects malformed request bodies", async () => {
    const { tournament, match } = await createTournamentWithMatch();

    const response = await saveScore(
      request(tournament._id.toString(), match._id.toString()),
      context(tournament._id.toString(), match._id.toString()),
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

    const response = await saveScore(
      request(tournamentId, matchId, {
        setIndex: 0,
        scoreA: 11,
        scoreB: 9,
      }),
      context(tournamentId, matchId),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
