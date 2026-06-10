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

function playerEntries(names: string[]) {
  return names.map((name, index) => ({
    name,
    players: [name],
    seed: index + 1,
  }));
}

function joinedPlayer(displayName: string) {
  const firstName = displayName.split(" ")[0] ?? displayName;

  return {
    userId: new Types.ObjectId(),
    playerProfileId: new Types.ObjectId(),
    firstName,
    displayName,
    email: `${firstName.toLowerCase()}@example.com`,
    joinedAt: new Date(),
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

  it("starts a configured single-elimination manual knockout tournament", async () => {
    const teams = makeTeams(6);
    const tournament = await Tournament.create({
      name: "Manual KO Cup",
      knockoutBracketType: "single_elimination",
      firstRoundPairingMode: "manual",
      knockoutMatchFormat: "bo1",
      teamSize: 2,
      courtsAvailable: 2,
      inputMode: "teams",
      teams,
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );
    const body = await response.json();
    const savedTournament = await Tournament.findById(tournament._id);
    const firstRound = savedTournament?.matches
      .filter((match) => match.bracket === "winner" && match.round === 1)
      .sort((a, b) => a.position - b.position);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      matchesGenerated: 7,
      byeCount: 2,
    });
    expect(savedTournament?.matches.some((match) => match.bracket === "loser")).toBe(false);
    expect(savedTournament?.matches.every((match) => match.format === "bo1")).toBe(true);
    expect(
      firstRound?.map((match) => [
        match.teamA
          ? teams.findIndex((team) => team._id.equals(match.teamA?.teamId)) + 1
          : null,
        match.teamB
          ? teams.findIndex((team) => team._id.equals(match.teamB?.teamId)) + 1
          : null,
      ]),
    ).toEqual([
      [1, 2],
      [3, 4],
      [5, null],
      [6, null],
    ]);
  });

  it("starts a team round-robin tournament with every team pairing", async () => {
    const teams = makeTeams(4);
    const tournament = await Tournament.create({
      name: "League Cup",
      format: "team_round_robin",
      teamSize: 2,
      courtsAvailable: 3,
      inputMode: "teams",
      teams,
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );
    const body = await response.json();
    const savedTournament = await Tournament.findById(tournament._id);
    const pairKeys = savedTournament?.matches.map((match) =>
      [match.teamA?.teamId.toString(), match.teamB?.teamId.toString()]
        .sort()
        .join(":"),
    );

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      format: "team_round_robin",
      matchesGenerated: 6,
      byeCount: 0,
    });
    expect(body.autoStartedMatches).toHaveLength(3);
    expect(savedTournament?.matches).toHaveLength(6);
    expect(new Set(pairKeys).size).toBe(6);
    expect(savedTournament?.matches.some((match) => match.bracket === "loser")).toBe(false);
  });

  it("generates exact equal teams for a team round-robin player-entry tournament", async () => {
    const tournament = await Tournament.create({
      name: "Player League",
      format: "team_round_robin",
      teamSize: 2,
      courtsAvailable: 3,
      inputMode: "players",
      teams: playerEntries([
        "Alice",
        "Bob",
        "Charlie",
        "Dana",
        "Eli",
        "Fran",
        "Gus",
        "Hana",
      ]),
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );
    const body = await response.json();
    const savedTournament = await Tournament.findById(tournament._id);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      format: "team_round_robin",
      matchesGenerated: 6,
      byeCount: 0,
    });
    expect(savedTournament?.teams).toHaveLength(4);
    expect(savedTournament?.teams.map((team) => team.players.length)).toEqual([
      2,
      2,
      2,
      2,
    ]);
    expect(savedTournament?.matches).toHaveLength(6);
  });

  it("rejects team round-robin player rosters that are not exactly divisible", async () => {
    const tournament = await Tournament.create({
      name: "Bad Player League",
      format: "team_round_robin",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "players",
      teams: playerEntries([
        "Alice",
        "Bob",
        "Charlie",
        "Dana",
        "Eli",
        "Fran",
        "Gus",
        "Hana",
        "Iris",
      ]),
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );
    const savedTournament = await Tournament.findById(tournament._id);

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(savedTournament?.status).toBe("draft");
  });

  it("includes self-joined players in team round-robin player generation", async () => {
    const tournament = await Tournament.create({
      name: "Open Player League",
      format: "team_round_robin",
      teamSize: 2,
      courtsAvailable: 2,
      inputMode: "players",
      allowSelfJoin: true,
      teams: playerEntries(["Alice", "Bob"]),
      joinedPlayers: [joinedPlayer("Charlie Example"), joinedPlayer("Dana Example")],
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );
    const savedTournament = await Tournament.findById(tournament._id);
    const generatedPlayers = savedTournament?.teams.flatMap((team) => team.players);

    expect(response.status).toBe(200);
    expect(generatedPlayers).toEqual(
      expect.arrayContaining([
        "Alice",
        "Bob",
        "Charlie Example",
        "Dana Example",
      ]),
    );
  });

  it("preserves registered player profile IDs when generating team round-robin teams", async () => {
    const aliceProfileId = new Types.ObjectId();
    const bobProfileId = new Types.ObjectId();
    const tournament = await Tournament.create({
      name: "Registered Player League",
      format: "team_round_robin",
      teamSize: 2,
      courtsAvailable: 2,
      inputMode: "players",
      teams: [
        {
          name: "Manual Alice",
          players: ["Alice Example"],
          playerProfileIds: [aliceProfileId],
          seed: 1,
        },
        {
          name: "Manual Bob",
          players: ["Bob Example"],
          playerProfileIds: [bobProfileId],
          seed: 2,
        },
      ],
      joinedPlayers: [
        {
          ...joinedPlayer("Charlie Example"),
          playerProfileId: new Types.ObjectId(),
        },
        {
          ...joinedPlayer("Dana Example"),
          playerProfileId: new Types.ObjectId(),
        },
      ],
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );
    const savedTournament = await Tournament.findById(tournament._id);
    const generatedProfileIds = savedTournament?.teams.flatMap((team) =>
      (team.playerProfileIds ?? []).map((id) => id?.toString()),
    );

    expect(response.status).toBe(200);
    expect(generatedProfileIds).toEqual(
      expect.arrayContaining([
        aliceProfileId.toString(),
        bobProfileId.toString(),
        tournament.joinedPlayers[0].playerProfileId.toString(),
        tournament.joinedPlayers[1].playerProfileId.toString(),
      ]),
    );
  });

  it("deduplicates manual and self-joined player names before exact generation", async () => {
    const tournament = await Tournament.create({
      name: "Duplicate Player League",
      format: "team_round_robin",
      teamSize: 2,
      courtsAvailable: 2,
      inputMode: "players",
      teams: playerEntries(["Alice Example", "Bob", "Charlie", "Dana"]),
      joinedPlayers: [joinedPlayer("alice example")],
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );
    const savedTournament = await Tournament.findById(tournament._id);

    expect(response.status).toBe(200);
    expect(savedTournament?.teams.flatMap((team) => team.players)).toHaveLength(4);
    expect(savedTournament?.matches).toHaveLength(1);
  });

  it("uses the persisted BO3 setting for generated team round-robin matches", async () => {
    const tournament = await Tournament.create({
      name: "Best Of Player League",
      format: "team_round_robin",
      roundRobinMatchFormat: "bo3",
      teamSize: 2,
      courtsAvailable: 2,
      inputMode: "players",
      teams: playerEntries(["Alice", "Bob", "Charlie", "Dana"]),
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );
    const savedTournament = await Tournament.findById(tournament._id);

    expect(response.status).toBe(200);
    expect(savedTournament?.matches.every((match) => match.format === "bo3")).toBe(true);
  });

  it("starts an individual mixer tournament with temporary match teams", async () => {
    const tournament = await Tournament.create({
      name: "Mixer Cup",
      format: "individual_mixer",
      teamSize: 2,
      courtsAvailable: 2,
      inputMode: "players",
      teams: [
        { name: "Alice", players: ["Alice"], seed: 1 },
        { name: "Bob", players: ["Bob"], seed: 2 },
        { name: "Charlie", players: ["Charlie"], seed: 3 },
        { name: "Dana", players: ["Dana"], seed: 4 },
      ],
    });

    const response = await startTournament(
      request(tournament._id.toString()),
      context(tournament._id.toString()),
    );
    const body = await response.json();
    const savedTournament = await Tournament.findById(tournament._id);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      format: "individual_mixer",
      matchesGenerated: 3,
      byeCount: 0,
    });
    expect(savedTournament?.teams).toHaveLength(6);
    expect(savedTournament?.teams[0].players).toHaveLength(2);
    expect(savedTournament?.matches).toHaveLength(3);
    expect(savedTournament?.matches.every((match) => match.teamA && match.teamB)).toBe(true);
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
