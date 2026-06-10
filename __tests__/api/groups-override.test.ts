import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TournamentGroup } from "@/lib/models/TournamentGroup";
import type { IGroupMatch } from "@/lib/models/TournamentGroup";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
}));

import { POST as overrideMatch } from "@/app/api/groups/[id]/categories/[catId]/matches/[matchId]/override/route";

function request(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function ctx(id: string, catId: string, matchId: string) {
  return { params: Promise.resolve({ id, catId, matchId }) };
}

function makeId() {
  return new Types.ObjectId();
}

describe("POST /api/groups/.../matches/.../override", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("reverses downstream advancement when the winner changes", async () => {
    const [t1, t2, t3, t4] = [makeId(), makeId(), makeId(), makeId()];
    const [semi1Id, semi2Id, finalId] = [makeId(), makeId(), makeId()];

    // Setup: semi1 is completed (t1 won), winner advanced to final.teamA
    // Final now has teamA = t1 (from semi1) and teamB = t3 (from semi2, already completed)
    const group = await TournamentGroup.create({
      name: "Cup",
      status: "active",
      teams: [
        { _id: t1, name: "T1", players: [], seed: 1 },
        { _id: t2, name: "T2", players: [], seed: 2 },
        { _id: t3, name: "T3", players: [], seed: 3 },
        { _id: t4, name: "T4", players: [], seed: 4 },
      ],
      categories: [
        {
          name: "Cat A",
          position: 0,
          matches: [
            // Semi 1: t1 won, completed — t1 advanced to final slot A
            {
              _id: semi1Id,
              bracket: "winner" as const,
              round: 1,
              position: 0,
              label: "Semi-Final",
              placeRange: "",
              format: "bo1" as const,
              teamA: { teamId: t1, sets: [{ scoreA: 21, scoreB: 15, pointsToWin: 21 }] },
              teamB: { teamId: t2, sets: [] },
              status: "completed" as const,
              winnerId: t1,
              loserId: t2,
              winnerNextMatchId: finalId,
              winnerNextSlot: "A" as const,
              loserNextMatchId: null,
              loserNextSlot: null,
              isBye: false,
              isWBFinal: false,
              isLBFinal: false,
              courtNumber: null,
            } satisfies IGroupMatch,
            // Semi 2: t3 won, completed — t3 advanced to final slot B
            {
              _id: semi2Id,
              bracket: "winner" as const,
              round: 1,
              position: 1,
              label: "Semi-Final",
              placeRange: "",
              format: "bo1" as const,
              teamA: { teamId: t3, sets: [{ scoreA: 21, scoreB: 15, pointsToWin: 21 }] },
              teamB: { teamId: t4, sets: [] },
              status: "completed" as const,
              winnerId: t3,
              loserId: t4,
              winnerNextMatchId: finalId,
              winnerNextSlot: "B" as const,
              loserNextMatchId: null,
              loserNextSlot: null,
              isBye: false,
              isWBFinal: false,
              isLBFinal: false,
              courtNumber: null,
            } satisfies IGroupMatch,
            // Final: ready (both slots filled from semis)
            {
              _id: finalId,
              bracket: "winner" as const,
              round: 2,
              position: 0,
              label: "Final",
              placeRange: "1st-2nd Place",
              format: "bo1" as const,
              teamA: { teamId: t1, sets: [] },
              teamB: { teamId: t3, sets: [] },
              status: "ready" as const,
              winnerId: null,
              loserId: null,
              winnerNextMatchId: null,
              winnerNextSlot: null,
              loserNextMatchId: null,
              loserNextSlot: null,
              isBye: false,
              isWBFinal: true,
              isLBFinal: false,
              courtNumber: null,
            } satisfies IGroupMatch,
          ],
        },
      ],
    });

    const catId = group.categories[0]._id.toString();

    // Override semi1: t2 actually won (not t1)
    const res = await overrideMatch(
      request(
        `http://localhost/api/groups/${group._id}/categories/${catId}/matches/${semi1Id}/override`,
        { sets: [{ scoreA: 15, scoreB: 21 }] }, // t2 wins
      ),
      ctx(group._id.toString(), catId, semi1Id.toString()),
    );
    const body = await res.json();

    expect(res.status).toBe(200);

    const cat = body.categories[0];
    const semi1 = cat.matches.find((m: IGroupMatch & { _id: string }) => m._id === semi1Id.toString());
    const final = cat.matches.find((m: IGroupMatch & { _id: string }) => m._id === finalId.toString());

    // semi1 should now show t2 as winner
    expect(semi1!.winnerId).toBe(t2.toString());

    // Final slot A should now be t2 (not t1), advancing the corrected winner
    expect(final!.teamA.teamId).toBe(t2.toString());
  });

  it("returns 409 when match is not completed", async () => {
    const [t1, t2] = [makeId(), makeId()];
    const matchId = makeId();

    const group = await TournamentGroup.create({
      name: "Cup",
      status: "active",
      teams: [],
      categories: [
        {
          name: "Cat A",
          position: 0,
          matches: [
            {
              _id: matchId,
              bracket: "winner" as const,
              round: 1,
              position: 0,
              label: "Final",
              placeRange: "1st-2nd Place",
              format: "bo1" as const,
              teamA: { teamId: t1, sets: [] },
              teamB: { teamId: t2, sets: [] },
              status: "in_progress" as const,
              winnerId: null,
              loserId: null,
              winnerNextMatchId: null,
              winnerNextSlot: null,
              loserNextMatchId: null,
              loserNextSlot: null,
              isBye: false,
              isWBFinal: true,
              isLBFinal: false,
              courtNumber: null,
            } satisfies IGroupMatch,
          ],
        },
      ],
    });

    const catId = group.categories[0]._id.toString();
    const res = await overrideMatch(
      request(
        `http://localhost/api/groups/${group._id}/categories/${catId}/matches/${matchId}/override`,
        { sets: [{ scoreA: 21, scoreB: 15 }] },
      ),
      ctx(group._id.toString(), catId, matchId.toString()),
    );
    expect(res.status).toBe(409);
  });

  it("returns 401 when not authenticated", async () => {
    requireAdmin.mockResolvedValue(false);
    const res = await overrideMatch(
      request(
        `http://localhost/api/groups/${makeId()}/categories/${makeId()}/matches/${makeId()}/override`,
        { sets: [{ scoreA: 21, scoreB: 15 }] },
      ),
      ctx(makeId().toString(), makeId().toString(), makeId().toString()),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when match not found", async () => {
    const res = await overrideMatch(
      request(
        `http://localhost/api/groups/${makeId()}/categories/${makeId()}/matches/${makeId()}/override`,
        { sets: [{ scoreA: 21, scoreB: 15 }] },
      ),
      ctx(makeId().toString(), makeId().toString(), makeId().toString()),
    );
    expect(res.status).toBe(404);
  });
});
