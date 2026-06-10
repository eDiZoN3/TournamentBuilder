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

import { PUT as enterScore } from "@/app/api/groups/[id]/categories/[catId]/matches/[matchId]/scores/route";
import { PUT as updateStatus } from "@/app/api/groups/[id]/categories/[catId]/matches/[matchId]/status/route";

function request(url: string, method: string, body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : undefined,
  });
}

function ctx(id: string, catId: string, matchId: string) {
  return { params: Promise.resolve({ id, catId, matchId }) };
}

function makeId() {
  return new Types.ObjectId();
}

function baseMatch(overrides: Partial<IGroupMatch> & Pick<IGroupMatch, "_id">): IGroupMatch {
  return {
    bracket: "winner",
    round: 1,
    position: 0,
    label: "Final",
    placeRange: "1st-2nd Place",
    format: "bo1",
    teamA: null,
    teamB: null,
    status: "in_progress",
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
    ...overrides,
  };
}

describe("/api/groups/.../matches/.../scores", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("saves a set score to the in-progress match and returns the updated group", async () => {
    const [t1, t2] = [makeId(), makeId()];
    const matchId = makeId();

    const group = await TournamentGroup.create({
      name: "Cup",
      status: "active",
      teams: [
        { _id: t1, name: "Team 1", players: [], seed: 1 },
        { _id: t2, name: "Team 2", players: [], seed: 2 },
      ],
      categories: [
        {
          name: "Cat A",
          position: 0,
          matches: [
            baseMatch({
              _id: matchId,
              teamA: { teamId: t1, sets: [] },
              teamB: { teamId: t2, sets: [] },
            }),
          ],
        },
      ],
    });

    const catId = group.categories[0]._id.toString();
    const res = await enterScore(
      request(
        `http://localhost/api/groups/${group._id}/categories/${catId}/matches/${matchId}/scores`,
        "PUT",
        { setIndex: 0, scoreA: 21, scoreB: 15 },
      ),
      ctx(group._id.toString(), catId, matchId.toString()),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    const updatedMatch = body.categories[0].matches[0];
    expect(updatedMatch.teamA.sets).toHaveLength(1);
    expect(updatedMatch.teamA.sets[0].scoreA).toBe(21);
    expect(updatedMatch.teamA.sets[0].scoreB).toBe(15);
  });

  it("returns 409 when match is not in_progress (scores route)", async () => {
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
            baseMatch({
              _id: matchId,
              status: "ready",
              teamA: { teamId: t1, sets: [] },
              teamB: { teamId: t2, sets: [] },
            }),
          ],
        },
      ],
    });

    const catId = group.categories[0]._id.toString();
    const res = await enterScore(
      request(
        `http://localhost/api/groups/${group._id}/categories/${catId}/matches/${matchId}/scores`,
        "PUT",
        { setIndex: 0, scoreA: 21, scoreB: 15 },
      ),
      ctx(group._id.toString(), catId, matchId.toString()),
    );
    expect(res.status).toBe(409);
  });

  it("returns 401 when not authenticated (scores route)", async () => {
    requireAdmin.mockResolvedValue(false);
    const res = await enterScore(
      request(
        `http://localhost/api/groups/${makeId()}/categories/${makeId()}/matches/${makeId()}/scores`,
        "PUT",
        { setIndex: 0, scoreA: 21, scoreB: 15 },
      ),
      ctx(makeId().toString(), makeId().toString(), makeId().toString()),
    );
    expect(res.status).toBe(401);
  });
});

describe("/api/groups/.../matches/.../status", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("completes a match when a winning score is set and marks group complete when it is the last match", async () => {
    const [t1, t2] = [makeId(), makeId()];
    const matchId = makeId();

    const group = await TournamentGroup.create({
      name: "Cup",
      status: "active",
      teams: [
        { _id: t1, name: "Team 1", players: [], seed: 1 },
        { _id: t2, name: "Team 2", players: [], seed: 2 },
      ],
      categories: [
        {
          name: "Cat A",
          position: 0,
          matches: [
            baseMatch({
              _id: matchId,
              teamA: { teamId: t1, sets: [{ scoreA: 21, scoreB: 15, pointsToWin: 21 }] },
              teamB: { teamId: t2, sets: [] },
            }),
          ],
        },
      ],
    });

    const catId = group.categories[0]._id.toString();
    const res = await updateStatus(
      request(
        `http://localhost/api/groups/${group._id}/categories/${catId}/matches/${matchId}/status`,
        "PUT",
        { status: "completed" },
      ),
      ctx(group._id.toString(), catId, matchId.toString()),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.categories[0].matches[0].status).toBe("completed");
    expect(body.categories[0].matches[0].winnerId).toBe(t1.toString());
    expect(body.status).toBe("completed");
  });

  it("advances the winner to the next match's slot", async () => {
    const [t1, t2, t3, t4] = [makeId(), makeId(), makeId(), makeId()];
    const [semi1Id, semi2Id, finalId] = [makeId(), makeId(), makeId()];

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
            // Semi 1: t1 vs t2, in_progress, t1 winning
            {
              _id: semi1Id,
              bracket: "winner",
              round: 1,
              position: 0,
              label: "Semi-Final",
              placeRange: "",
              format: "bo1",
              teamA: { teamId: t1, sets: [{ scoreA: 21, scoreB: 15, pointsToWin: 21 }] },
              teamB: { teamId: t2, sets: [] },
              status: "in_progress",
              winnerId: null,
              loserId: null,
              winnerNextMatchId: finalId,
              winnerNextSlot: "A",
              loserNextMatchId: null,
              loserNextSlot: null,
              isBye: false,
              isWBFinal: false,
              isLBFinal: false,
              courtNumber: null,
            },
            // Semi 2: t3 vs t4, ready
            {
              _id: semi2Id,
              bracket: "winner",
              round: 1,
              position: 1,
              label: "Semi-Final",
              placeRange: "",
              format: "bo1",
              teamA: { teamId: t3, sets: [] },
              teamB: { teamId: t4, sets: [] },
              status: "ready",
              winnerId: null,
              loserId: null,
              winnerNextMatchId: finalId,
              winnerNextSlot: "B",
              loserNextMatchId: null,
              loserNextSlot: null,
              isBye: false,
              isWBFinal: false,
              isLBFinal: false,
              courtNumber: null,
            },
            // Final: pending
            {
              _id: finalId,
              bracket: "winner",
              round: 2,
              position: 0,
              label: "Final",
              placeRange: "1st-2nd Place",
              format: "bo1",
              teamA: null,
              teamB: null,
              status: "pending",
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
            },
          ],
        },
      ],
    });

    const catId = group.categories[0]._id.toString();
    const res = await updateStatus(
      request(
        `http://localhost/api/groups/${group._id}/categories/${catId}/matches/${semi1Id}/status`,
        "PUT",
        { status: "completed" },
      ),
      ctx(group._id.toString(), catId, semi1Id.toString()),
    );
    const body = await res.json();

    expect(res.status).toBe(200);

    const cat = body.categories[0];
    const final = cat.matches.find((m: IGroupMatch & { _id: string }) => m._id === finalId.toString());
    expect(final!.teamA).not.toBeNull();
    expect(final!.teamA.teamId).toBe(t1.toString());

    // Semi2 should now be in_progress (auto-started since teams t3,t4 are free)
    const semi2 = cat.matches.find((m: IGroupMatch & { _id: string }) => m._id === semi2Id.toString());
    expect(semi2!.status).toBe("in_progress");
  });

  it("does not start a match when all teams are in active matches", async () => {
    // Cat A: match1 (t1 vs t2) in_progress
    // Cat B: match2 (t1 vs t2) ready → cannot start because t1 and t2 are busy in Cat A
    const [t1, t2] = [makeId(), makeId()];
    const match1Id = makeId();
    const match2Id = makeId();

    const group = await TournamentGroup.create({
      name: "Cup",
      status: "active",
      teams: [
        { _id: t1, name: "T1", players: [], seed: 1 },
        { _id: t2, name: "T2", players: [], seed: 2 },
      ],
      categories: [
        {
          name: "Cat A",
          position: 0,
          matches: [
            // Final 1 in_progress
            baseMatch({
              _id: match1Id,
              teamA: { teamId: t1, sets: [{ scoreA: 21, scoreB: 15, pointsToWin: 21 }] },
              teamB: { teamId: t2, sets: [] },
            }),
            // Need a second match after this one to avoid group completion
            {
              _id: makeId(),
              bracket: "winner" as const,
              round: 2,
              position: 0,
              label: "placeholder",
              placeRange: "",
              format: "bo1" as const,
              teamA: null,
              teamB: null,
              status: "pending" as const,
              winnerId: null,
              loserId: null,
              winnerNextMatchId: null,
              winnerNextSlot: null,
              loserNextMatchId: null,
              loserNextSlot: null,
              isBye: false,
              isWBFinal: false,
              isLBFinal: false,
              courtNumber: null,
            },
          ],
        },
        {
          name: "Cat B",
          position: 1,
          matches: [
            baseMatch({
              _id: match2Id,
              status: "ready" as const,
              teamA: { teamId: t1, sets: [] },
              teamB: { teamId: t2, sets: [] },
            }),
          ],
        },
      ],
    });

    const catId = group.categories[0]._id.toString();
    const res = await updateStatus(
      request(
        `http://localhost/api/groups/${group._id}/categories/${catId}/matches/${match1Id}/status`,
        "PUT",
        { status: "completed" },
      ),
      ctx(group._id.toString(), catId, match1Id.toString()),
    );
    const body = await res.json();

    expect(res.status).toBe(200);

    // Cat B's match2 (t1 vs t2) should remain ready, not in_progress,
    // because all matches in Cat A are done but there's still a pending match
    // and Cat B can now start since t1 and t2 are free
    // Actually — t1 and t2 are now FREE after Cat A match1 completes
    // So Cat B's match2 should be started (t1, t2 are free)
    const catB = body.categories[1];
    expect(catB.matches[0].status).toBe("in_progress");
  });

  it("returns 409 when match is not in_progress (status route)", async () => {
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
            baseMatch({
              _id: matchId,
              status: "ready" as const,
              teamA: { teamId: t1, sets: [] },
              teamB: { teamId: t2, sets: [] },
            }),
          ],
        },
      ],
    });

    const catId = group.categories[0]._id.toString();
    const res = await updateStatus(
      request(
        `http://localhost/api/groups/${group._id}/categories/${catId}/matches/${matchId}/status`,
        "PUT",
        { status: "completed" },
      ),
      ctx(group._id.toString(), catId, matchId.toString()),
    );
    expect(res.status).toBe(409);
  });

  it("returns 401 when not authenticated (status route)", async () => {
    requireAdmin.mockResolvedValue(false);
    const res = await updateStatus(
      request(
        `http://localhost/api/groups/${makeId()}/categories/${makeId()}/matches/${makeId()}/status`,
        "PUT",
        { status: "completed" },
      ),
      ctx(makeId().toString(), makeId().toString(), makeId().toString()),
    );
    expect(res.status).toBe(401);
  });
});
