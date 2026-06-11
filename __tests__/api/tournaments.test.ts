import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeTeams } from "@/__tests__/helpers/factories";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { Tournament } from "@/lib/models/Tournament";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
}));

import { GET as listTournaments, POST as createTournament } from "@/app/api/tournaments/route";
import {
  DELETE as deleteTournament,
  GET as getTournament,
  PUT as updateTournament,
} from "@/app/api/tournaments/[id]/route";

function request(
  url: string,
  method = "GET",
  body?: Record<string, unknown>,
) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body
      ? {
          "content-type": "application/json",
        }
      : undefined,
  });
}

function context(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

describe("/api/tournaments", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("lists no tournaments when the database is empty", async () => {
    const response = await listTournaments();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ tournaments: [] });
  });

  it("lists summary fields and excludes bye matches from the match count", async () => {
    await Tournament.create({
      name: "First Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams: makeTeams(2),
      matches: [makeMatch(), makeMatch({ isBye: true })],
    });
    await Tournament.create({
      name: "Second Cup",
      teamSize: 4,
      courtsAvailable: 2,
      inputMode: "players",
    });

    const response = await listTournaments();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tournaments).toHaveLength(2);
    expect(body.tournaments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          format: "double_elimination",
          knockoutBracketType: "double_elimination",
          firstRoundPairingMode: "random",
          matchResultMode: "points",
          knockoutMatchFormat: "bo3_semis_finals",
          roundRobinMatchFormat: "bo1",
          name: "First Cup",
          status: "draft",
          teamCount: 2,
          matchCount: 1,
        }),
        expect.objectContaining({
          format: "double_elimination",
          knockoutBracketType: "double_elimination",
          firstRoundPairingMode: "random",
          matchResultMode: "points",
          knockoutMatchFormat: "bo3_semis_finals",
          roundRobinMatchFormat: "bo1",
          name: "Second Cup",
          status: "draft",
          teamCount: 0,
          matchCount: 0,
        }),
      ]),
    );
    expect(body.tournaments[0].createdAt).toEqual(expect.any(String));
  });

  it("creates a valid tournament", async () => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "Summer Cup",
        teamSize: 3,
        courtsAvailable: 2,
        inputMode: "players",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      _id: expect.any(String),
      name: "Summer Cup",
      status: "draft",
      format: "double_elimination",
      knockoutBracketType: "double_elimination",
      firstRoundPairingMode: "random",
      matchResultMode: "points",
      knockoutMatchFormat: "bo3_semis_finals",
      roundRobinMatchFormat: "bo1",
      teamSize: 3,
      courtsAvailable: 2,
    });
    await expect(Tournament.countDocuments()).resolves.toBe(1);
  });

  it("creates a single-elimination manual winner-only knockout tournament", async () => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "Manual KO Cup",
        format: "double_elimination",
        knockoutBracketType: "single_elimination",
        firstRoundPairingMode: "manual",
        matchResultMode: "winner_only",
        teamSize: 2,
        courtsAvailable: 2,
        inputMode: "teams",
      }),
    );
    const body = await response.json();
    const saved = await Tournament.findById(body._id).lean();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      knockoutBracketType: "single_elimination",
      firstRoundPairingMode: "manual",
      matchResultMode: "winner_only",
      knockoutMatchFormat: "bo1",
    });
    expect(saved).toMatchObject({
      knockoutBracketType: "single_elimination",
      firstRoundPairingMode: "manual",
      matchResultMode: "winner_only",
      knockoutMatchFormat: "bo1",
    });
  });

  it("creates an empty draft without teams or matches", async () => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "Ahead Of Time Cup",
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "teams",
      }),
    );
    const body = await response.json();
    const saved = await Tournament.findById(body._id).lean();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      name: "Ahead Of Time Cup",
      status: "draft",
      teams: [],
      matches: [],
    });
    expect(saved).toMatchObject({
      status: "draft",
      teams: [],
      matches: [],
    });
  });

  it("creates a team round-robin tournament", async () => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "League Cup",
        format: "team_round_robin",
        teamSize: 2,
        courtsAvailable: 2,
        inputMode: "teams",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      format: "team_round_robin",
      inputMode: "teams",
      name: "League Cup",
      roundRobinMatchFormat: "bo1",
    });
    await expect(Tournament.findOne({ name: "League Cup" }).lean()).resolves.toMatchObject({
      format: "team_round_robin",
      roundRobinMatchFormat: "bo1",
    });
  });

  it("creates a team round-robin tournament with player entry", async () => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "Player League",
        format: "team_round_robin",
        teamSize: 2,
        courtsAvailable: 2,
        inputMode: "players",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      format: "team_round_robin",
      inputMode: "players",
      name: "Player League",
      roundRobinMatchFormat: "bo1",
    });
  });

  it("creates a self-joinable team round-robin player-entry tournament", async () => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "Open League",
        format: "team_round_robin",
        teamSize: 2,
        courtsAvailable: 2,
        inputMode: "players",
        allowSelfJoin: true,
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      allowSelfJoin: true,
      format: "team_round_robin",
      inputMode: "players",
      roundRobinMatchFormat: "bo1",
    });
  });

  it("accepts best-of-three as the round-robin match format", async () => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "Best Of League",
        format: "team_round_robin",
        roundRobinMatchFormat: "bo3",
        teamSize: 2,
        courtsAvailable: 2,
        inputMode: "teams",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      format: "team_round_robin",
      roundRobinMatchFormat: "bo3",
    });
  });

  it("creates an individual mixer tournament", async () => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "Mixer Cup",
        format: "individual_mixer",
        teamSize: 2,
        courtsAvailable: 2,
        inputMode: "players",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      format: "individual_mixer",
      inputMode: "players",
      name: "Mixer Cup",
    });
  });

  it("creates an event tournament with participant and discipline counts", async () => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "Event Cup",
        format: "event",
        eventParticipantCount: 12,
        eventDisciplineCount: 4,
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "players",
      }),
    );
    const body = await response.json();
    const saved = await Tournament.findById(body._id).lean();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      format: "event",
      inputMode: "players",
      matchResultMode: "winner_only",
      knockoutMatchFormat: "bo1",
      courtsAvailable: 1,
      eventParticipantCount: 12,
      eventDisciplineCount: 4,
      eventDisciplines: [
        "Discipline 1",
        "Discipline 2",
        "Discipline 3",
        "Discipline 4",
      ],
    });
    expect(saved).toMatchObject({
      format: "event",
      eventParticipantCount: 12,
      eventDisciplineCount: 4,
      eventDisciplines: [
        "Discipline 1",
        "Discipline 2",
        "Discipline 3",
        "Discipline 4",
      ],
    });
  });

  it("creates a self-joinable player-entry event tournament", async () => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "Open Event",
        format: "event",
        eventParticipantCount: 8,
        eventDisciplineCount: 2,
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "players",
        allowSelfJoin: true,
      }),
    );
    const body = await response.json();
    const saved = await Tournament.findById(body._id).lean();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      format: "event",
      inputMode: "players",
      allowSelfJoin: true,
    });
    expect(saved?.allowSelfJoin).toBe(true);
  });

  it("rejects self-join for team-entry event tournaments", async () => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "Closed Event",
        format: "event",
        eventParticipantCount: 8,
        eventDisciplineCount: 2,
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "teams",
        allowSelfJoin: true,
      }),
    );

    expect(response.status).toBe(422);
  });

  it.each([
    [
      "individual mixer with teams",
      {
        name: "Bad Mixer",
        format: "individual_mixer",
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "teams",
      },
    ],
    [
      "knockout with best-of-three round-robin format",
      {
        name: "Bad Knockout Format",
        format: "double_elimination",
        roundRobinMatchFormat: "bo3",
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "teams",
      },
    ],
    [
      "invalid round-robin match format",
      {
        name: "Bad Match Format",
        format: "team_round_robin",
        roundRobinMatchFormat: "bo5",
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "teams",
      },
    ],
    [
      "invalid knockout bracket type",
      {
        name: "Bad Knockout Type",
        knockoutBracketType: "triple_elimination",
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "teams",
      },
    ],
    [
      "winner-only with BO3 knockout finals",
      {
        name: "Bad Winner Only",
        matchResultMode: "winner_only",
        knockoutMatchFormat: "bo3_semis_finals",
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "teams",
      },
    ],
  ])("rejects incompatible format settings: %s", async (_label, body) => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", body),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("creates a self-joinable player tournament", async () => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "Open Player Cup",
        teamSize: 2,
        courtsAvailable: 2,
        inputMode: "players",
        allowSelfJoin: true,
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      allowSelfJoin: true,
      name: "Open Player Cup",
    });

    const tournament = await Tournament.findOne({ name: "Open Player Cup" });

    expect(tournament?.allowSelfJoin).toBe(true);
  });

  it("rejects self-join for team-entry tournaments", async () => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "Team Cup",
        teamSize: 2,
        courtsAvailable: 2,
        inputMode: "teams",
        allowSelfJoin: true,
      }),
    );

    expect(response.status).toBe(422);
  });

  it.each([
    [{ name: "Summer Cup", teamSize: 5, courtsAvailable: 1, inputMode: "teams" }],
    [{ name: "Summer Cup", teamSize: 2, courtsAvailable: 0, inputMode: "teams" }],
    [{ name: "", teamSize: 2, courtsAvailable: 1, inputMode: "teams" }],
    [{ name: "Summer Cup", teamSize: 2, courtsAvailable: 1, inputMode: "manual" }],
    [
      {
        name: "Bad Event",
        format: "event",
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "teams",
        eventParticipantCount: 33,
        eventDisciplineCount: 2,
      },
    ],
    [
      {
        name: "Bad Event Disciplines",
        format: "event",
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "teams",
        eventParticipantCount: 8,
        eventDisciplineCount: 11,
      },
    ],
  ])("rejects invalid create requests", async (body) => {
    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", body),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("requires an authenticated admin to create tournaments", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await createTournament(
      request("http://localhost:3000/api/tournaments", "POST", {
        name: "Summer Cup",
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "teams",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication required",
      code: "UNAUTHORIZED",
    });
  });
});

describe("/api/tournaments/[id]", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("returns 404 for an unknown tournament", async () => {
    const response = await getTournament(
      request("http://localhost:3000/api/tournaments/missing"),
      context(new Types.ObjectId().toString()),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns 404 for an invalid tournament ID", async () => {
    const response = await getTournament(
      request("http://localhost:3000/api/tournaments/not-an-object-id"),
      context("not-an-object-id"),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns the full tournament including matches", async () => {
    const tournament = await Tournament.create({
      name: "Summer Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams: makeTeams(2),
      matches: [makeMatch({ label: "WB Final", isWBFinal: true })],
    });

    const response = await getTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`),
      context(tournament._id.toString()),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      _id: tournament._id.toString(),
      format: "double_elimination",
      knockoutBracketType: "double_elimination",
      firstRoundPairingMode: "random",
      matchResultMode: "points",
      knockoutMatchFormat: "bo3_semis_finals",
      roundRobinMatchFormat: "bo1",
      inputMode: "teams",
      teams: expect.any(Array),
      matches: [expect.objectContaining({ label: "WB Final" })],
    });
  });

  it("does not include joined player email addresses in the response body", async () => {
    const tournament = await Tournament.create({
      name: "Open Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "players",
      allowSelfJoin: true,
      joinedPlayers: [
        {
          userId: new Types.ObjectId(),
          playerProfileId: new Types.ObjectId(),
          firstName: "Alice",
          surname: "Example",
          displayName: "Alice Example",
          email: "alice@example.com",
          joinedAt: new Date(),
        },
      ],
    });

    const response = await getTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`),
      context(tournament._id.toString()),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.joinedPlayers).toEqual([
      expect.objectContaining({
        displayName: "Alice Example",
        firstName: "Alice",
      }),
    ]);
    expect(body.joinedPlayers[0]).not.toHaveProperty("email");
  });

  it("updates a draft tournament name and setup teams", async () => {
    const tournament = await Tournament.create({
      name: "Old Name",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
    });

    const response = await updateTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`, "PUT", {
        name: "New Name",
        teams: [
          { name: "Alpha", players: [], seed: 0 },
          { name: "Beta", players: [], seed: 0 },
        ],
      }),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(200);
    await expect(Tournament.findById(tournament._id).lean()).resolves.toMatchObject({
      name: "New Name",
      teams: [{ name: "Alpha" }, { name: "Beta" }],
    });
  });

  it("updates an event tournament roster and disciplines while in draft", async () => {
    const tournament = await Tournament.create({
      name: "Draft Event",
      format: "event",
      matchResultMode: "winner_only",
      knockoutMatchFormat: "bo1",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      eventParticipantCount: 3,
      eventDisciplineCount: 2,
      eventDisciplines: ["Discipline 1", "Discipline 2"],
    });

    const response = await updateTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`, "PUT", {
        teams: [
          { name: "Alpha", players: [], seed: 1 },
          { name: "Beta", players: [], seed: 2 },
          { name: "Gamma", players: [], seed: 3 },
        ],
        eventDisciplines: ["Darts", "Quiz"],
      }),
      context(tournament._id.toString()),
    );
    const saved = await Tournament.findById(tournament._id).lean();

    expect(response.status).toBe(200);
    expect(saved).toMatchObject({
      eventDisciplines: ["Darts", "Quiz"],
      teams: [{ name: "Alpha" }, { name: "Beta" }, { name: "Gamma" }],
    });
  });

  it("saves an empty draft roster without starting the tournament", async () => {
    const tournament = await Tournament.create({
      name: "Draft Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams: makeTeams(2),
    });

    const response = await updateTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`, "PUT", {
        teams: [],
      }),
      context(tournament._id.toString()),
    );
    const body = await response.json();
    const saved = await Tournament.findById(tournament._id).lean();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "draft",
      teams: [],
      matches: [],
    });
    expect(saved).toMatchObject({
      status: "draft",
      teams: [],
      matches: [],
    });
  });

  it("accepts manager-selected registered players and resolves their display names", async () => {
    const alice = await PlayerProfile.create({
      userId: new Types.ObjectId(),
      firstName: "Alice",
      surname: "Example",
      displayName: "Alice Example",
      email: "alice@example.com",
    });
    const bob = await PlayerProfile.create({
      userId: new Types.ObjectId(),
      firstName: "Bob",
      surname: "Builder",
      displayName: "Bob Builder",
      email: "bob@example.com",
    });
    const tournament = await Tournament.create({
      name: "Registered Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "players",
    });

    const response = await updateTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`, "PUT", {
        teams: [
          {
            name: "Alpha",
            players: ["Spoofed Alice", "Spoofed Bob"],
            playerProfileIds: [alice._id.toString(), bob._id.toString()],
            seed: 0,
          },
          {
            name: "Beta",
            players: ["Cara", "Dana"],
            seed: 0,
          },
        ],
      }),
      context(tournament._id.toString()),
    );
    const body = await response.json();
    const saved = await Tournament.findById(tournament._id).lean();

    expect(response.status).toBe(200);
    expect(body.teams[0]).toMatchObject({
      name: "Alpha",
      players: ["Alice Example", "Bob Builder"],
      playerProfileIds: [alice._id.toString(), bob._id.toString()],
    });
    expect(JSON.stringify(body)).not.toContain("alice@example.com");
    expect(saved?.teams[0].players).toEqual(["Alice Example", "Bob Builder"]);
    expect(saved?.teams[0].playerProfileIds?.map((id) => id?.toString())).toEqual([
      alice._id.toString(),
      bob._id.toString(),
    ]);
  });

  it("rejects duplicate registered players in a draft roster update", async () => {
    const alice = await PlayerProfile.create({
      userId: new Types.ObjectId(),
      firstName: "Alice",
      displayName: "Alice",
      email: "alice@example.com",
    });
    const tournament = await Tournament.create({
      name: "Duplicate Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "players",
    });

    const response = await updateTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`, "PUT", {
        teams: [
          {
            name: "Alpha",
            players: ["Alice"],
            playerProfileIds: [alice._id.toString()],
            seed: 0,
          },
          {
            name: "Beta",
            players: ["Alice Again"],
            playerProfileIds: [alice._id.toString()],
            seed: 0,
          },
        ],
      }),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("does not include joined player email addresses in update response bodies", async () => {
    const tournament = await Tournament.create({
      name: "Open Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "players",
      allowSelfJoin: true,
      joinedPlayers: [
        {
          userId: new Types.ObjectId(),
          playerProfileId: new Types.ObjectId(),
          firstName: "Alice",
          surname: "Example",
          displayName: "Alice Example",
          email: "alice@example.com",
          joinedAt: new Date(),
        },
      ],
    });

    const response = await updateTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`, "PUT", {
        name: "Open Cup Updated",
      }),
      context(tournament._id.toString()),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.joinedPlayers[0]).toMatchObject({
      displayName: "Alice Example",
      firstName: "Alice",
    });
    expect(body.joinedPlayers[0]).not.toHaveProperty("email");
  });

  it("rejects status changes through the update endpoint", async () => {
    const tournament = await Tournament.create({
      name: "Summer Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
    });

    const response = await updateTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`, "PUT", {
        status: "active",
      }),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("requires an authenticated admin to update tournaments", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await updateTournament(
      request("http://localhost:3000/api/tournaments/id", "PUT", {
        name: "New Name",
      }),
      context(new Types.ObjectId().toString()),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects team edits after a tournament has started", async () => {
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
    });

    const response = await updateTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`, "PUT", {
        teams: [{ name: "Alpha", players: [], seed: 0 }],
      }),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code: "CONFLICT" });
  });

  it("deletes a draft tournament", async () => {
    const tournament = await Tournament.create({
      name: "Summer Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
    });

    const response = await deleteTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`, "DELETE"),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(204);
    await expect(Tournament.findById(tournament._id)).resolves.toBeNull();
  });

  it("rejects active deletion without a confirmation name", async () => {
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
    });

    const response = await deleteTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`, "DELETE"),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code: "CONFLICT" });
    await expect(Tournament.findById(tournament._id)).resolves.not.toBeNull();
  });

  it("rejects active deletion with the wrong confirmation name", async () => {
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
    });

    const response = await deleteTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`, "DELETE", {
        confirmationName: "Wrong Cup",
      }),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code: "CONFLICT" });
    await expect(Tournament.findById(tournament._id)).resolves.not.toBeNull();
  });

  it("deletes an active tournament with an exact confirmation name", async () => {
    const tournament = await Tournament.create({
      name: "Summer Cup",
      status: "active",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
    });

    const response = await deleteTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`, "DELETE", {
        confirmationName: "Summer Cup",
      }),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(204);
    await expect(Tournament.findById(tournament._id)).resolves.toBeNull();
  });

  it("deletes a completed tournament with an exact confirmation name", async () => {
    const tournament = await Tournament.create({
      name: "Finished Cup",
      status: "completed",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
    });

    const response = await deleteTournament(
      request(`http://localhost:3000/api/tournaments/${tournament._id}`, "DELETE", {
        confirmationName: "Finished Cup",
      }),
      context(tournament._id.toString()),
    );

    expect(response.status).toBe(204);
    await expect(Tournament.findById(tournament._id)).resolves.toBeNull();
  });

  it("requires an authenticated admin to delete tournaments", async () => {
    requireAdmin.mockResolvedValue(false);

    const response = await deleteTournament(
      request("http://localhost:3000/api/tournaments/id", "DELETE"),
      context(new Types.ObjectId().toString()),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
