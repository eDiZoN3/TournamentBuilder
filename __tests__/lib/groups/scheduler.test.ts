import { Types } from "mongoose";
import { computeNextMatches } from "@/lib/groups/scheduler";
import type { ITournamentGroup, IGroupCategory, IGroupMatch } from "@/lib/models/TournamentGroup";

function makeTeamId(): Types.ObjectId {
  return new Types.ObjectId();
}

function makeMatchId(): Types.ObjectId {
  return new Types.ObjectId();
}

function makeMatch(
  id: Types.ObjectId,
  teamAId: Types.ObjectId | null,
  teamBId: Types.ObjectId | null,
  status: IGroupMatch["status"],
): IGroupMatch {
  return {
    _id: id,
    bracket: "winner",
    round: 1,
    position: 0,
    label: "Round 1",
    placeRange: "",
    format: "bo1",
    teamA: teamAId ? { teamId: teamAId, sets: [] } : null,
    teamB: teamBId ? { teamId: teamBId, sets: [] } : null,
    status,
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
  };
}

function makeCategory(
  position: number,
  matches: IGroupMatch[],
): IGroupCategory {
  return {
    _id: new Types.ObjectId(),
    name: `Category ${position}`,
    position,
    matches,
    currentMatchId: null,
  };
}

function makeGroup(categories: IGroupCategory[]): ITournamentGroup {
  return {
    _id: new Types.ObjectId(),
    name: "Test Group",
    status: "active",
    teams: [],
    categories,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("computeNextMatches", () => {
  it("returns empty when there are no categories", () => {
    const group = makeGroup([]);
    expect(computeNextMatches(group)).toEqual([]);
  });

  it("activates a ready match when no teams are busy", () => {
    const [t1, t2] = [makeTeamId(), makeTeamId()];
    const m1Id = makeMatchId();
    const cat = makeCategory(0, [makeMatch(m1Id, t1, t2, "ready")]);
    const group = makeGroup([cat]);

    const result = computeNextMatches(group);
    expect(result).toHaveLength(1);
    expect(result[0].categoryIndex).toBe(0);
    expect(result[0].matchId).toBe(m1Id.toString());
  });

  it("does not activate a match when the category already has an in_progress match", () => {
    const [t1, t2, t3, t4] = [makeTeamId(), makeTeamId(), makeTeamId(), makeTeamId()];
    const m1Id = makeMatchId();
    const m2Id = makeMatchId();
    const cat = makeCategory(0, [
      makeMatch(m1Id, t1, t2, "in_progress"),
      makeMatch(m2Id, t3, t4, "ready"),
    ]);
    const group = makeGroup([cat]);

    expect(computeNextMatches(group)).toEqual([]);
  });

  it("activates matches in both categories when teams don't conflict", () => {
    const [t1, t2, t3, t4] = [makeTeamId(), makeTeamId(), makeTeamId(), makeTeamId()];
    const [m1Id, m2Id] = [makeMatchId(), makeMatchId()];

    const catA = makeCategory(0, [makeMatch(m1Id, t1, t2, "ready")]);
    const catB = makeCategory(1, [makeMatch(m2Id, t3, t4, "ready")]);
    const group = makeGroup([catA, catB]);

    const result = computeNextMatches(group);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.matchId)).toContain(m1Id.toString());
    expect(result.map((r) => r.matchId)).toContain(m2Id.toString());
  });

  it("blocks a lower-priority category when its ready match shares a team with a higher-priority activation", () => {
    const [t1, t2, t3] = [makeTeamId(), makeTeamId(), makeTeamId()];
    const [m1Id, m2Id] = [makeMatchId(), makeMatchId()];

    // Cat A (priority 0): t1 vs t2 — will be activated
    const catA = makeCategory(0, [makeMatch(m1Id, t1, t2, "ready")]);
    // Cat B (priority 1): t1 vs t3 — blocked because t1 gets activated in Cat A first
    const catB = makeCategory(1, [makeMatch(m2Id, t1, t3, "ready")]);
    const group = makeGroup([catA, catB]);

    const result = computeNextMatches(group);
    expect(result).toHaveLength(1);
    expect(result[0].matchId).toBe(m1Id.toString());
  });

  it("respects priority order — lower position value = higher priority", () => {
    const [t1, t2, t3, t4] = [makeTeamId(), makeTeamId(), makeTeamId(), makeTeamId()];
    const [m1Id, m2Id] = [makeMatchId(), makeMatchId()];

    // Cat with position=1 stored first in array but lower priority
    const catB = makeCategory(1, [makeMatch(m1Id, t3, t4, "ready")]);
    // Cat with position=0 stored second but higher priority
    const catA = makeCategory(0, [makeMatch(m2Id, t1, t2, "ready")]);
    const group = makeGroup([catB, catA]);

    const result = computeNextMatches(group);
    // Both should be activated (different teams), but catA (position=0) should come first
    expect(result).toHaveLength(2);
    expect(result[0].categoryIndex).toBe(1); // catA is at index 1 in group.categories
    expect(result[1].categoryIndex).toBe(0); // catB is at index 0
  });

  it("skips a ready match with an in_progress conflict and finds no alternative", () => {
    const [t1, t2, t3] = [makeTeamId(), makeTeamId(), makeTeamId()];
    const [m1Id, m2Id] = [makeMatchId(), makeMatchId()];

    // Cat A: t1 vs t2, in_progress
    const catA = makeCategory(0, [makeMatch(m1Id, t1, t2, "in_progress")]);
    // Cat B: t1 vs t3, ready — blocked because t1 is busy in Cat A
    const catB = makeCategory(1, [makeMatch(m2Id, t1, t3, "ready")]);
    const group = makeGroup([catA, catB]);

    expect(computeNextMatches(group)).toEqual([]);
  });

  it("returns empty when all ready matches have team conflicts with existing in_progress", () => {
    const [t1, t2] = [makeTeamId(), makeTeamId()];
    const [m1Id, m2Id] = [makeMatchId(), makeMatchId()];

    const catA = makeCategory(0, [makeMatch(m1Id, t1, t2, "in_progress")]);
    const catB = makeCategory(1, [makeMatch(m2Id, t1, t2, "ready")]);
    const group = makeGroup([catA, catB]);

    expect(computeNextMatches(group)).toEqual([]);
  });

  it("returns empty when no ready matches exist at all", () => {
    const [t1, t2] = [makeTeamId(), makeTeamId()];
    const m1Id = makeMatchId();

    const cat = makeCategory(0, [makeMatch(m1Id, t1, t2, "pending")]);
    const group = makeGroup([cat]);

    expect(computeNextMatches(group)).toEqual([]);
  });
});
