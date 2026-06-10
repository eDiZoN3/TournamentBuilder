import { Types } from "mongoose";
import { computeLeaderboard } from "@/lib/groups/leaderboard";
import type { ITournamentGroup, IGroupCategory, IGroupMatch, IGroupTeam } from "@/lib/models/TournamentGroup";

function makeTeam(name: string): IGroupTeam {
  return {
    _id: new Types.ObjectId(),
    name,
    players: [],
    seed: 1,
  };
}

function makeMatch(overrides: Partial<IGroupMatch> & Pick<IGroupMatch, "_id" | "round">): IGroupMatch {
  return {
    bracket: "winner",
    position: 0,
    label: "",
    placeRange: "",
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
    isWBFinal: false,
    isLBFinal: false,
    courtNumber: null,
    ...overrides,
  };
}

function makeCategory(position: number, matches: IGroupMatch[]): IGroupCategory {
  return {
    _id: new Types.ObjectId(),
    name: `Category ${position}`,
    position,
    matches,
    currentMatchId: null,
  };
}

function makeGroup(teams: IGroupTeam[], categories: IGroupCategory[]): ITournamentGroup {
  return {
    _id: new Types.ObjectId(),
    name: "Test Group",
    status: "completed",
    teams,
    categories,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("computeLeaderboard", () => {
  it("returns an empty array when there are no categories", () => {
    const group = makeGroup([], []);
    expect(computeLeaderboard(group)).toEqual([]);
  });

  it("returns an empty array when no matches are completed", () => {
    const [t1, t2] = [makeTeam("A"), makeTeam("B")];
    const final = makeMatch({
      _id: new Types.ObjectId(),
      round: 1,
      isWBFinal: true,
      placeRange: "1st-2nd Place",
      teamA: { teamId: t1._id, sets: [] },
      teamB: { teamId: t2._id, sets: [] },
      status: "pending",
    });
    const cat = makeCategory(0, [final]);
    const group = makeGroup([t1, t2], [cat]);

    expect(computeLeaderboard(group)).toEqual([]);
  });

  it("ranks teams by placement in a single 2-team category", () => {
    const [t1, t2] = [makeTeam("Alpha"), makeTeam("Beta")];
    const final = makeMatch({
      _id: new Types.ObjectId(),
      round: 1,
      isWBFinal: true,
      placeRange: "1st-2nd Place",
      teamA: { teamId: t1._id, sets: [] },
      teamB: { teamId: t2._id, sets: [] },
      status: "completed",
      winnerId: t1._id,
      loserId: t2._id,
    });
    const cat = makeCategory(0, [final]);
    const group = makeGroup([t1, t2], [cat]);

    const board = computeLeaderboard(group);
    expect(board).toHaveLength(2);
    expect(board[0].teamId).toBe(t1._id.toString());
    expect(board[0].totalScore).toBe(1);
    expect(board[1].teamId).toBe(t2._id.toString());
    expect(board[1].totalScore).toBe(2);
  });

  it("sums placement scores across two categories", () => {
    const [t1, t2] = [makeTeam("Alpha"), makeTeam("Beta")];
    const finalA = makeMatch({
      _id: new Types.ObjectId(),
      round: 1,
      isWBFinal: true,
      placeRange: "1st-2nd Place",
      teamA: { teamId: t1._id, sets: [] },
      teamB: { teamId: t2._id, sets: [] },
      status: "completed",
      winnerId: t1._id, // t1 = 1st in catA
      loserId: t2._id,  // t2 = 2nd in catA
    });
    const finalB = makeMatch({
      _id: new Types.ObjectId(),
      round: 1,
      isWBFinal: true,
      placeRange: "1st-2nd Place",
      teamA: { teamId: t2._id, sets: [] },
      teamB: { teamId: t1._id, sets: [] },
      status: "completed",
      winnerId: t2._id, // t2 = 1st in catB
      loserId: t1._id,  // t1 = 2nd in catB
    });
    const catA = makeCategory(0, [finalA]);
    const catB = makeCategory(1, [finalB]);
    const group = makeGroup([t1, t2], [catA, catB]);

    const board = computeLeaderboard(group);
    expect(board).toHaveLength(2);
    // t1: 1st(1) + 2nd(2) = 3
    // t2: 2nd(2) + 1st(1) = 3
    // tie → same total score, tiebreaker by wins
    expect(board[0].totalScore).toBe(3);
    expect(board[1].totalScore).toBe(3);
    // Both have 1 win each — truly tied
    expect(board[0].totalWins).toBe(1);
    expect(board[1].totalWins).toBe(1);
  });

  it("breaks ties by total wins (more wins = better rank)", () => {
    const [t1, t2] = [makeTeam("Alpha"), makeTeam("Beta")];
    // Two categories: t1 wins both finals → t1 total=2, t2 total=4
    // Three categories: t1 wins cat A final and loses cat B
    const finalA = makeMatch({
      _id: new Types.ObjectId(),
      round: 1,
      isWBFinal: true,
      placeRange: "1st-2nd Place",
      teamA: { teamId: t1._id, sets: [] },
      teamB: { teamId: t2._id, sets: [] },
      status: "completed",
      winnerId: t1._id,
      loserId: t2._id,
    });
    const finalB = makeMatch({
      _id: new Types.ObjectId(),
      round: 1,
      isWBFinal: true,
      placeRange: "1st-2nd Place",
      teamA: { teamId: t1._id, sets: [] },
      teamB: { teamId: t2._id, sets: [] },
      status: "completed",
      winnerId: t1._id,
      loserId: t2._id,
    });
    // Extra category where t2 wins — makes both have score 3 but different wins
    const finalC = makeMatch({
      _id: new Types.ObjectId(),
      round: 1,
      isWBFinal: true,
      placeRange: "1st-2nd Place",
      teamA: { teamId: t2._id, sets: [] },
      teamB: { teamId: t1._id, sets: [] },
      status: "completed",
      winnerId: t2._id,
      loserId: t1._id,
    });
    const group = makeGroup(
      [t1, t2],
      [makeCategory(0, [finalA]), makeCategory(1, [finalB]), makeCategory(2, [finalC])],
    );

    const board = computeLeaderboard(group);
    // t1: 1+1+2=4 score, 2 wins
    // t2: 2+2+1=5 score, 1 win
    expect(board[0].teamId).toBe(t1._id.toString());
    expect(board[0].totalScore).toBe(4);
    expect(board[0].totalWins).toBe(2);
    expect(board[1].teamId).toBe(t2._id.toString());
    expect(board[1].totalScore).toBe(5);
  });

  it("assigns 3rd place to semi-final losers in a 4-team single-elimination", () => {
    // 4 teams, 2 rounds
    // Round 1 (semi-finals): t1 vs t2 and t3 vs t4
    // Round 2 (final): t1 vs t3
    const [t1, t2, t3, t4] = [makeTeam("A"), makeTeam("B"), makeTeam("C"), makeTeam("D")];

    const semi1Id = new Types.ObjectId();
    const semi2Id = new Types.ObjectId();
    const finalId = new Types.ObjectId();

    const semi1 = makeMatch({
      _id: semi1Id,
      round: 1,
      isWBFinal: false,
      teamA: { teamId: t1._id, sets: [] },
      teamB: { teamId: t2._id, sets: [] },
      status: "completed",
      winnerId: t1._id,
      loserId: t2._id,
      winnerNextMatchId: finalId,
    });
    const semi2 = makeMatch({
      _id: semi2Id,
      round: 1,
      isWBFinal: false,
      teamA: { teamId: t3._id, sets: [] },
      teamB: { teamId: t4._id, sets: [] },
      status: "completed",
      winnerId: t3._id,
      loserId: t4._id,
      winnerNextMatchId: finalId,
    });
    const final = makeMatch({
      _id: finalId,
      round: 2,
      isWBFinal: true,
      placeRange: "1st-2nd Place",
      teamA: { teamId: t1._id, sets: [] },
      teamB: { teamId: t3._id, sets: [] },
      status: "completed",
      winnerId: t1._id,
      loserId: t3._id,
    });

    const cat = makeCategory(0, [semi1, semi2, final]);
    const group = makeGroup([t1, t2, t3, t4], [cat]);

    const board = computeLeaderboard(group);
    expect(board).toHaveLength(4);

    const row = (id: Types.ObjectId) => board.find((r) => r.teamId === id.toString())!;
    expect(row(t1._id).totalScore).toBe(1); // 1st place
    expect(row(t3._id).totalScore).toBe(2); // 2nd place
    // t2 and t4 both lost in round 1 (out of 2 total rounds) → 3rd place
    expect(row(t2._id).totalScore).toBe(3);
    expect(row(t4._id).totalScore).toBe(3);
  });

  it("includes team names in the leaderboard rows", () => {
    const [t1, t2] = [makeTeam("Team One"), makeTeam("Team Two")];
    const final = makeMatch({
      _id: new Types.ObjectId(),
      round: 1,
      isWBFinal: true,
      placeRange: "1st-2nd Place",
      teamA: { teamId: t1._id, sets: [] },
      teamB: { teamId: t2._id, sets: [] },
      status: "completed",
      winnerId: t1._id,
      loserId: t2._id,
    });
    const group = makeGroup([t1, t2], [makeCategory(0, [final])]);

    const board = computeLeaderboard(group);
    expect(board[0].teamName).toBe("Team One");
    expect(board[1].teamName).toBe("Team Two");
  });
});
