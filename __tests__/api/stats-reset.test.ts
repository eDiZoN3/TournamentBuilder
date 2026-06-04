import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeSet, makeTeams } from "@/__tests__/helpers/factories";
import { GET as globalStats } from "@/app/api/stats/route";
import { GET as tournamentStats } from "@/app/api/tournaments/[id]/stats/route";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { Tournament } from "@/lib/models/Tournament";

const { requireAdminSession } = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdminSession,
}));

function resetRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/admin/stats/reset", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
}

function tournamentContext(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

async function resetStats(body: Record<string, unknown>) {
  const modulePath = "@/app/api/admin/stats/reset/route";
  const { POST } = await import(modulePath);

  return POST(resetRequest(body));
}

async function createCompletedTournament(name: string, playerNames = ["Alice", "Bob"]) {
  const teams = makeTeams(2);
  teams[0].name = `${name} Alpha`;
  teams[0].players = [playerNames[0]];
  teams[1].name = `${name} Beta`;
  teams[1].players = [playerNames[1]];

  return Tournament.create({
    name,
    status: "completed",
    teamSize: 2,
    courtsAvailable: 1,
    inputMode: "teams",
    teams,
    matches: [
      makeMatch({
        status: "completed",
        teamA: { teamId: teams[0]._id, sets: [makeSet(11, 7)] },
        teamB: { teamId: teams[1]._id, sets: [] },
        winnerId: teams[0]._id,
        loserId: teams[1]._id,
      }),
    ],
  });
}

describe("POST /api/admin/stats/reset", () => {
  beforeEach(() => {
    requireAdminSession.mockReset();
    requireAdminSession.mockResolvedValue({
      user: {
        id: "super-admin-id",
        role: "admin",
      },
    });
  });

  it("resets one player by profile id while preserving team stats", async () => {
    const profile = await PlayerProfile.create({
      userId: new Types.ObjectId(),
      firstName: "Alice",
      displayName: "Alice",
      email: "alice@example.com",
    });
    await createCompletedTournament("Player Reset Cup", ["Alice", "Bob"]);

    const response = await resetStats({
      scope: "player",
      playerProfileId: profile._id.toString(),
      confirmation: "RESET STATS",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      reset: {
        scope: "player",
        playerProfileId: profile._id.toString(),
      },
    });

    const statsResponse = await globalStats();
    const stats = await statsResponse.json();

    expect(stats.players).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Alice" })]),
    );
    expect(stats.players).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Bob" })]),
    );
    expect(stats.teams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Player Reset Cup Alpha",
          matchesWon: 1,
          pointsFor: 11,
        }),
      ]),
    );
  });

  it("resets one tournament from global and per-tournament stats without deleting history", async () => {
    const resetTournament = await createCompletedTournament("Reset Cup");
    await createCompletedTournament("Kept Cup", ["Cara", "Dana"]);

    const response = await resetStats({
      scope: "tournament",
      tournamentId: resetTournament._id.toString(),
      confirmation: "RESET STATS",
    });

    expect(response.status).toBe(200);

    const globalResponse = await globalStats();
    const globalBody = await globalResponse.json();

    expect(globalBody.teams).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Reset Cup Alpha" }),
      ]),
    );
    expect(globalBody.teams).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Kept Cup Alpha" })]),
    );

    const tournamentResponse = await tournamentStats(
      new NextRequest(
        `http://localhost:3000/api/tournaments/${resetTournament._id}/stats`,
      ),
      tournamentContext(resetTournament._id.toString()),
    );

    expect(tournamentResponse.status).toBe(200);
    await expect(tournamentResponse.json()).resolves.toEqual({
      teams: [],
      players: [],
    });

    const storedTournament = await Tournament.findById(resetTournament._id).lean();

    expect(storedTournament?.matches).toHaveLength(1);
    expect(storedTournament?.status).toBe("completed");
  });

  it("resets a calendar-year season without affecting other years", async () => {
    const seasonTournament = await createCompletedTournament("Season Cup");
    const otherTournament = await createCompletedTournament("Older Cup", [
      "Eve",
      "Frank",
    ]);
    await Tournament.findByIdAndUpdate(seasonTournament._id, {
      createdAt: new Date("2026-03-01T12:00:00.000Z"),
    });
    await Tournament.findByIdAndUpdate(otherTournament._id, {
      createdAt: new Date("2025-03-01T12:00:00.000Z"),
    });

    const response = await resetStats({
      scope: "season",
      season: 2026,
      confirmation: "RESET STATS",
    });

    expect(response.status).toBe(200);

    const statsResponse = await globalStats();
    const stats = await statsResponse.json();

    expect(stats.teams).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Season Cup Alpha" }),
      ]),
    );
    expect(stats.teams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Older Cup Alpha" }),
      ]),
    );
  });

  it("resets all stats while keeping tournaments and matches", async () => {
    const tournament = await createCompletedTournament("Complete Reset Cup");

    const response = await resetStats({
      scope: "all",
      confirmation: "RESET STATS",
    });

    expect(response.status).toBe(200);

    const statsResponse = await globalStats();

    expect(statsResponse.status).toBe(200);
    await expect(statsResponse.json()).resolves.toEqual({
      teams: [],
      players: [],
    });
    await expect(Tournament.findById(tournament._id).lean()).resolves.toMatchObject({
      name: "Complete Reset Cup",
      matches: expect.any(Array),
    });
  });

  it("rejects tournament leads", async () => {
    requireAdminSession.mockResolvedValue({
      user: {
        id: "lead-id",
        role: "tournament_lead",
      },
    });

    const response = await resetStats({
      scope: "all",
      confirmation: "RESET STATS",
    });

    expect(response.status).toBe(403);
  });

  it("rejects invalid reset payloads", async () => {
    const missingConfirmation = await resetStats({
      scope: "all",
    });
    const invalidScope = await resetStats({
      scope: "player",
      confirmation: "RESET STATS",
    });

    expect(missingConfirmation.status).toBe(422);
    expect(invalidScope.status).toBe(422);
  });
});
