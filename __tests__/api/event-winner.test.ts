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
});
