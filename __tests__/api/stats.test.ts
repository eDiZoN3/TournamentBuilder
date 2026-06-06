import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { makeMatch, makeSet, makeTeams } from "@/__tests__/helpers/factories";
import { GET as globalStats } from "@/app/api/stats/route";
import { GET as tournamentStats } from "@/app/api/tournaments/[id]/stats/route";
import { PracticeMatch } from "@/lib/models/PracticeMatch";
import { Tournament } from "@/lib/models/Tournament";

function request(url: string) {
  return new NextRequest(url);
}

function context(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

describe("stats API", () => {
  it("returns per-tournament team and player stats without admin auth", async () => {
    const teams = makeTeams(2);
    teams[0].players = ["Alice"];
    teams[1].players = ["Bob"];
    const tournament = await Tournament.create({
      name: "Stats Cup",
      status: "completed",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: teams[0]._id, sets: [makeSet(11, 9)] },
          teamB: { teamId: teams[1]._id, sets: [] },
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
        }),
      ],
    });

    const response = await tournamentStats(
      request(`http://localhost:3000/api/tournaments/${tournament._id}/stats`),
      context(tournament._id.toString()),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      teams: expect.arrayContaining([
        expect.objectContaining({
          name: "Team A",
          matchesWon: 1,
          pointsFor: 11,
          winRate: 1,
        }),
      ]),
      players: expect.arrayContaining([
        expect.objectContaining({
          name: "Alice",
          matchesWon: 1,
          pointsFor: 11,
        }),
      ]),
    });
  });

  it("returns global cross-season stats sorted by wins", async () => {
    const firstTeams = makeTeams(2);
    firstTeams[0].name = "Alpha";
    firstTeams[1].name = "Beta";
    const secondTeams = makeTeams(2);
    secondTeams[0].name = "Alpha";
    secondTeams[1].name = "Gamma";
    await Tournament.create({
      name: "First Cup",
      status: "completed",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams: firstTeams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: firstTeams[0]._id, sets: [makeSet(11, 9)] },
          teamB: { teamId: firstTeams[1]._id, sets: [] },
          winnerId: firstTeams[0]._id,
          loserId: firstTeams[1]._id,
        }),
      ],
    });
    await Tournament.create({
      name: "Second Cup",
      status: "completed",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams: secondTeams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: secondTeams[0]._id, sets: [makeSet(11, 7)] },
          teamB: { teamId: secondTeams[1]._id, sets: [] },
          winnerId: secondTeams[0]._id,
          loserId: secondTeams[1]._id,
        }),
      ],
    });

    const response = await globalStats();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.teams[0]).toMatchObject({
      name: "Alpha",
      matchesPlayed: 2,
      matchesWon: 2,
      pointsFor: 22,
      pointsAgainst: 16,
      winRate: 1,
    });
  });

  it("returns practice stats separately from tournament player stats", async () => {
    const aliceId = new Types.ObjectId();
    const bobId = new Types.ObjectId();
    await PracticeMatch.create({
      createdBy: aliceId,
      playedAt: new Date("2026-06-06T12:00:00.000Z"),
      sideA: [{ playerProfileId: aliceId, displayName: "Practice Alice" }],
      sideB: [{ playerProfileId: bobId, displayName: "Practice Bob" }],
      sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 }],
      winnerSide: "A",
    });

    const response = await globalStats();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.players).toEqual([]);
    expect(body.practicePlayers).toEqual([
      expect.objectContaining({
        playerProfileId: aliceId.toString(),
        name: "Practice Alice",
        matchesWon: 1,
      }),
      expect.objectContaining({
        playerProfileId: bobId.toString(),
        name: "Practice Bob",
        matchesLost: 1,
      }),
    ]);
  });

  it("returns empty arrays when no tournaments exist", async () => {
    const response = await globalStats();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      teams: [],
      players: [],
      practicePlayers: [],
    });
  });

  it("returns 404 for an invalid or unknown tournament id", async () => {
    const invalid = await tournamentStats(
      request("http://localhost:3000/api/tournaments/invalid/stats"),
      context("invalid"),
    );
    const missingId = new Types.ObjectId().toString();
    const missing = await tournamentStats(
      request(`http://localhost:3000/api/tournaments/${missingId}/stats`),
      context(missingId),
    );

    expect(invalid.status).toBe(404);
    await expect(invalid.json()).resolves.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
