import { makeMatch, makeSet, makeTeams, makeTournament } from "@/__tests__/helpers/factories";
import { buildNonKnockoutStandings } from "@/lib/standings/nonKnockout";
import type { ITournament } from "@/lib/models/Tournament";

describe("buildNonKnockoutStandings", () => {
  it("ranks team round-robin standings by wins, point difference, points, then name", () => {
    const teams = makeTeams(4);
    const tournament = makeTournament({
      format: "team_round_robin",
      status: "completed",
      teams,
      matches: [
        makeMatch({
          status: "completed",
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
          teamA: { teamId: teams[0]._id, sets: [makeSet(11, 9)] },
          teamB: { teamId: teams[1]._id, sets: [] },
        }),
        makeMatch({
          status: "completed",
          winnerId: teams[0]._id,
          loserId: teams[2]._id,
          teamA: { teamId: teams[0]._id, sets: [makeSet(11, 3)] },
          teamB: { teamId: teams[2]._id, sets: [] },
        }),
        makeMatch({
          status: "completed",
          winnerId: teams[1]._id,
          loserId: teams[3]._id,
          teamA: { teamId: teams[1]._id, sets: [makeSet(11, 2)] },
          teamB: { teamId: teams[3]._id, sets: [] },
        }),
        makeMatch({
          status: "completed",
          winnerId: teams[2]._id,
          loserId: teams[3]._id,
          teamA: { teamId: teams[2]._id, sets: [makeSet(11, 10)] },
          teamB: { teamId: teams[3]._id, sets: [] },
        }),
        makeMatch({
          status: "ready",
          teamA: { teamId: teams[1]._id, sets: [] },
          teamB: { teamId: teams[2]._id, sets: [] },
        }),
      ],
    }) as ITournament;

    const standings = buildNonKnockoutStandings(tournament);

    expect(standings.map((row) => row.name)).toEqual([
      "Team A",
      "Team B",
      "Team C",
      "Team D",
    ]);
    expect(standings[0]).toMatchObject({
      losses: 0,
      matchesPlayed: 2,
      pointsFor: 22,
      rank: 1,
      wins: 2,
    });
    expect(standings[1].pointDiff).toBeGreaterThan(standings[2].pointDiff);
  });

  it("ranks individual mixer players from temporary team results", () => {
    const teams = makeTeams(4);
    teams[0].name = "Round 1 Team A";
    teams[0].players = ["Alice", "Bob"];
    teams[1].name = "Round 1 Team B";
    teams[1].players = ["Charlie", "Dana"];
    teams[2].name = "Round 2 Team A";
    teams[2].players = ["Alice", "Charlie"];
    teams[3].name = "Round 2 Team B";
    teams[3].players = ["Bob", "Dana"];
    const tournament = makeTournament({
      format: "individual_mixer",
      inputMode: "players",
      status: "completed",
      teams,
      matches: [
        makeMatch({
          status: "completed",
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
          teamA: { teamId: teams[0]._id, sets: [makeSet(11, 6)] },
          teamB: { teamId: teams[1]._id, sets: [] },
        }),
        makeMatch({
          status: "completed",
          winnerId: teams[3]._id,
          loserId: teams[2]._id,
          teamA: { teamId: teams[2]._id, sets: [makeSet(9, 11)] },
          teamB: { teamId: teams[3]._id, sets: [] },
        }),
      ],
    }) as ITournament;

    const standings = buildNonKnockoutStandings(tournament);

    expect(standings.map((row) => row.name)).toEqual([
      "Bob",
      "Alice",
      "Dana",
      "Charlie",
    ]);
    expect(standings[0]).toMatchObject({
      entity: "player",
      losses: 0,
      matchesPlayed: 2,
      rank: 1,
      wins: 2,
    });
  });
});
