import { Types } from "mongoose";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTeams } from "@/__tests__/helpers/factories";
import { generateEventTournamentMatches } from "@/lib/eventTournament";
import { Tournament } from "@/lib/models/Tournament";
import type { ITeam } from "@/lib/models/Tournament";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
}));

import { PUT as selectEventWinner } from "@/app/api/tournaments/[id]/event/matches/[matchId]/winner/route";

function request(
  tournamentId: string,
  matchId: string,
  body: Record<string, unknown>,
) {
  return new NextRequest(
    `http://localhost:3000/api/tournaments/${tournamentId}/event/matches/${matchId}/winner`,
    {
      method: "PUT",
      body: JSON.stringify(body),
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

describe("PUT /api/tournaments/[id]/event/matches/[matchId]/winner", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("selects and toggles an event match winner", async () => {
    const teams = makeTeams(4) as ITeam[];
    const matches = generateEventTournamentMatches(teams, ["Darts"], 11);
    const tournament = await Tournament.create({
      name: "Event Cup",
      format: "event",
      matchResultMode: "winner_only",
      knockoutMatchFormat: "bo1",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      eventParticipantCount: 4,
      eventDisciplineCount: 1,
      eventDisciplines: ["Darts"],
      status: "active",
      teams,
      matches,
    });
    const match = tournament.matches.find(
      (candidate) => candidate.round === 1 && candidate.status === "ready",
    )!;
    const winnerId = match.teamA!.teamId.toString();

    const selectResponse = await selectEventWinner(
      request(tournament._id.toString(), match._id.toString(), { winnerId }),
      context(tournament._id.toString(), match._id.toString()),
    );
    const selectBody = await selectResponse.json();
    const selectedTournament = await Tournament.findById(tournament._id);
    const selectedMatch = selectedTournament!.matches.find(
      (candidate) => candidate._id.toString() === match._id.toString(),
    )!;

    expect(selectResponse.status).toBe(200);
    expect(selectBody).toMatchObject({
      selected: true,
      winnerId,
    });
    expect(selectedMatch.status).toBe("completed");
    expect(selectedMatch.winnerId?.toString()).toBe(winnerId);
    expect(
      selectedTournament!.matches.some(
        (candidate) =>
          candidate.round === 2 &&
          [candidate.teamA?.teamId.toString(), candidate.teamB?.teamId.toString()]
            .includes(winnerId),
      ),
    ).toBe(true);

    const clearResponse = await selectEventWinner(
      request(tournament._id.toString(), match._id.toString(), { winnerId }),
      context(tournament._id.toString(), match._id.toString()),
    );
    const clearBody = await clearResponse.json();
    const clearedTournament = await Tournament.findById(tournament._id);
    const clearedMatch = clearedTournament!.matches.find(
      (candidate) => candidate._id.toString() === match._id.toString(),
    )!;

    expect(clearResponse.status).toBe(200);
    expect(clearBody).toMatchObject({
      selected: false,
      winnerId: null,
    });
    expect(clearedMatch.status).toBe("ready");
    expect(clearedMatch.winnerId).toBeNull();
  });

  async function createEventTournament() {
    const teams = makeTeams(4) as ITeam[];
    const matches = generateEventTournamentMatches(teams, ["Darts"], 11);

    return Tournament.create({
      name: "Event Cup",
      format: "event",
      matchResultMode: "winner_only",
      knockoutMatchFormat: "bo1",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      eventParticipantCount: 4,
      eventDisciplineCount: 1,
      eventDisciplines: ["Darts"],
      status: "active",
      teams,
      matches,
    });
  }

  it("returns 401 when the requester is not an admin", async () => {
    requireAdmin.mockResolvedValue(false);
    const id = new Types.ObjectId().toString();
    const matchId = new Types.ObjectId().toString();

    const response = await selectEventWinner(
      request(id, matchId, { winnerId: new Types.ObjectId().toString() }),
      context(id, matchId),
    );

    expect(response.status).toBe(401);
  });



  it("rejects stale event winner updates from disconnected clients", async () => {
    const tournament = await createEventTournament();
    const match = tournament.matches.find(
      (candidate) => candidate.round === 1 && candidate.status === "ready",
    )!;
    const staleUpdatedAt = new Date(
      tournament.updatedAt.getTime() - 1000,
    ).toISOString();

    const response = await selectEventWinner(
      request(tournament._id.toString(), match._id.toString(), {
        tournamentUpdatedAt: staleUpdatedAt,
        winnerId: match.teamA!.teamId.toString(),
      }),
      context(tournament._id.toString(), match._id.toString()),
    );
    const body = await response.json();
    const unchangedTournament = await Tournament.findById(tournament._id);
    const unchangedMatch = unchangedTournament!.matches.find(
      (candidate) => candidate._id.toString() === match._id.toString(),
    )!;

    expect(response.status).toBe(409);
    expect(body.code).toBe("STALE_TOURNAMENT");
    expect(unchangedMatch.status).toBe("ready");
    expect(unchangedMatch.winnerId).toBeNull();
  });

  it("rejects a body without a valid winner id", async () => {
    const id = new Types.ObjectId().toString();
    const matchId = new Types.ObjectId().toString();

    const response = await selectEventWinner(
      request(id, matchId, { winnerId: "not-an-id" }),
      context(id, matchId),
    );

    expect(response.status).toBe(422);
  });

  it("returns 404 for an invalid tournament id", async () => {
    const response = await selectEventWinner(
      request("not-valid", "also-not-valid", {
        winnerId: new Types.ObjectId().toString(),
      }),
      context("not-valid", "also-not-valid"),
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when the tournament or match does not exist", async () => {
    const id = new Types.ObjectId().toString();
    const matchId = new Types.ObjectId().toString();

    const response = await selectEventWinner(
      request(id, matchId, { winnerId: new Types.ObjectId().toString() }),
      context(id, matchId),
    );

    expect(response.status).toBe(404);
  });

  it("rejects winner selection on a non-event tournament", async () => {
    const teams = makeTeams(4) as ITeam[];
    const matches = generateEventTournamentMatches(teams, ["Darts"], 11);
    const tournament = await Tournament.create({
      name: "Regular Cup",
      format: "double_elimination",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      status: "active",
      teams,
      matches,
    });
    const match = tournament.matches.find((candidate) => candidate.round === 1)!;

    const response = await selectEventWinner(
      request(tournament._id.toString(), match._id.toString(), {
        winnerId: match.teamA!.teamId.toString(),
      }),
      context(tournament._id.toString(), match._id.toString()),
    );

    expect(response.status).toBe(409);
  });

  it("rejects a winner that is not one of the match participants", async () => {
    const tournament = await createEventTournament();
    const match = tournament.matches.find(
      (candidate) => candidate.round === 1 && candidate.status === "ready",
    )!;

    const response = await selectEventWinner(
      request(tournament._id.toString(), match._id.toString(), {
        winnerId: new Types.ObjectId().toString(),
      }),
      context(tournament._id.toString(), match._id.toString()),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toBe("Winner must be one of the match participants");
  });

  it("rejects selecting a winner before both participants are known", async () => {
    const tournament = await createEventTournament();
    const finalMatch = tournament.matches.find(
      (candidate) => candidate.round === 2,
    )!;

    const response = await selectEventWinner(
      request(tournament._id.toString(), finalMatch._id.toString(), {
        winnerId: new Types.ObjectId().toString(),
      }),
      context(tournament._id.toString(), finalMatch._id.toString()),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toBe("Both participants are required");
  });
});
