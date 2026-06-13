import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { generateEventTournamentMatches } from "@/lib/eventTournament";
import {
  makeMatch,
  makeSet,
  makeTeams,
  makeTournament,
} from "@/__tests__/helpers/factories";
import {
  aggregateStats,
  calculateTournamentStats,
} from "@/lib/stats";
import type { ITournament } from "@/lib/models/Tournament";

function tournament(
  overrides: Parameters<typeof makeTournament>[0],
): ITournament {
  return makeTournament(overrides) as ITournament;
}

describe("calculateTournamentStats", () => {
  it("counts BO1 match, set, and point totals for teams", () => {
    const teams = makeTeams(2);
    const cup = tournament({
      teams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: teams[0]._id, sets: [makeSet(11, 9)] },
          teamB: { teamId: teams[1]._id, sets: [] },
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
        }),
      ],
    });

    const stats = calculateTournamentStats(cup);

    expect(stats.teams).toEqual([
      expect.objectContaining({
        name: "Team A",
        matchesPlayed: 1,
        matchesWon: 1,
        matchesLost: 0,
        setsWon: 1,
        setsLost: 0,
        pointsFor: 11,
        pointsAgainst: 9,
        pointDiff: 2,
        winRate: 1,
      }),
      expect.objectContaining({
        name: "Team B",
        matchesPlayed: 1,
        matchesWon: 0,
        matchesLost: 1,
        setsWon: 0,
        setsLost: 1,
        pointsFor: 9,
        pointsAgainst: 11,
        pointDiff: -2,
        winRate: 0,
      }),
    ]);
  });

  it("counts BO3 set wins and player stats inherited from team matches", () => {
    const teams = makeTeams(2);
    teams[0].players = ["Alice", "Bob"];
    teams[1].players = ["Cara", "Drew"];
    const cup = tournament({
      teams,
      matches: [
        makeMatch({
          format: "bo3",
          status: "completed",
          teamA: {
            teamId: teams[0]._id,
            sets: [makeSet(11, 8), makeSet(9, 11), makeSet(15, 13)],
          },
          teamB: { teamId: teams[1]._id, sets: [] },
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
        }),
      ],
    });

    const stats = calculateTournamentStats(cup);

    expect(stats.teams[0]).toMatchObject({
      name: "Team A",
      matchesPlayed: 1,
      matchesWon: 1,
      setsWon: 2,
      setsLost: 1,
      pointsFor: 35,
      pointsAgainst: 32,
      pointDiff: 3,
    });
    expect(stats.players).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Alice",
          matchesPlayed: 1,
          matchesWon: 1,
          setsWon: 2,
          setsLost: 1,
          pointsFor: 35,
          pointsAgainst: 32,
        }),
        expect.objectContaining({
          name: "Cara",
          matchesPlayed: 1,
          matchesLost: 1,
          setsWon: 1,
          setsLost: 2,
          pointsFor: 32,
          pointsAgainst: 35,
        }),
      ]),
    );
  });

  it("counts winner-only matches without adding set or point totals", () => {
    const teams = makeTeams(2);
    teams[0].players = ["Alice"];
    teams[1].players = ["Bob"];
    const cup = tournament({
      matchResultMode: "winner_only",
      teams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[1]._id, sets: [] },
          winnerId: teams[1]._id,
          loserId: teams[0]._id,
        }),
      ],
    });

    const stats = calculateTournamentStats(cup);

    expect(stats.teams).toEqual([
      expect.objectContaining({
        name: "Team B",
        matchesPlayed: 1,
        matchesWon: 1,
        setsWon: 0,
        setsLost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      }),
      expect.objectContaining({
        name: "Team A",
        matchesPlayed: 1,
        matchesLost: 1,
        setsWon: 0,
        setsLost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      }),
    ]);
    expect(stats.players).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Bob",
          matchesWon: 1,
          pointsFor: 0,
        }),
      ]),
    );
  });

  it("excludes byes and incomplete matches but keeps rostered zero rows", () => {
    const teams = makeTeams(3);
    const cup = tournament({
      teams,
      matches: [
        makeMatch({
          isBye: true,
          status: "completed",
          teamA: { teamId: teams[0]._id, sets: [] },
          winnerId: teams[0]._id,
        }),
        makeMatch({
          status: "ready",
          teamA: { teamId: teams[1]._id, sets: [] },
          teamB: { teamId: teams[2]._id, sets: [] },
        }),
      ],
    });

    const stats = calculateTournamentStats(cup);

    expect(stats.teams).toHaveLength(3);
    expect(stats.teams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Team A",
          matchesPlayed: 0,
          matchesWon: 0,
          pointsFor: 0,
          pointDiff: 0,
        }),
      ]),
    );
  });


  it("scores event tournament wins by round and counts first-round byes immediately", () => {
    const teams = makeTeams(3);
    const matches = generateEventTournamentMatches(teams as ITournament["teams"], ["Darts"], 1);
    const byeMatch = matches.find((match) => match.isBye)!;
    const firstRoundMatch = matches.find(
      (match) => match.round === 1 && !match.isBye,
    )!;
    const finalMatch = matches.find((match) => match.isWBFinal)!;
    const firstRoundWinnerId = firstRoundMatch.teamA!.teamId;
    const firstRoundLoserId = firstRoundMatch.teamB!.teamId;

    firstRoundMatch.status = "completed";
    firstRoundMatch.winnerId = firstRoundWinnerId;
    firstRoundMatch.loserId = firstRoundLoserId;
    finalMatch.teamA = { teamId: byeMatch.winnerId!, sets: [] };
    finalMatch.teamB = { teamId: firstRoundWinnerId, sets: [] };
    finalMatch.status = "completed";
    finalMatch.winnerId = byeMatch.winnerId;
    finalMatch.loserId = firstRoundWinnerId;

    const stats = calculateTournamentStats(
      tournament({
        format: "event",
        matchResultMode: "winner_only",
        teams,
        matches,
      }),
    );

    expect(stats.teams).toEqual([
      expect.objectContaining({
        name: "Team A",
        matchesPlayed: 2,
        matchesWon: 2,
        matchesLost: 0,
        tournamentPoints: 4,
      }),
      expect.objectContaining({
        name: "Team B",
        matchesPlayed: 2,
        matchesWon: 1,
        matchesLost: 1,
        tournamentPoints: 1,
      }),
      expect.objectContaining({
        name: "Team C",
        matchesPlayed: 1,
        matchesWon: 0,
        matchesLost: 1,
        tournamentPoints: 0,
      }),
    ]);
  });
});

describe("aggregateStats", () => {
  it("aggregates teams and players across tournaments by normalized names", () => {
    const firstTeams = makeTeams(2);
    firstTeams[0].name = "Alpha";
    firstTeams[0].players = ["Sam"];
    firstTeams[1].name = "Beta";
    firstTeams[1].players = ["Lee"];
    const secondTeams = makeTeams(2);
    secondTeams[0].name = " alpha ";
    secondTeams[0].players = [" sam "];
    secondTeams[1].name = "Gamma";
    secondTeams[1].players = ["Mia"];
    const first = tournament({
      teams: firstTeams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: firstTeams[0]._id, sets: [makeSet(11, 9)] },
          teamB: { teamId: firstTeams[1]._id, sets: [] },
          winnerId: firstTeams[0]._id,
          loserId: firstTeams[1]._id,
        }),
      ],
    });
    const second = tournament({
      teams: secondTeams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: secondTeams[0]._id, sets: [makeSet(8, 11)] },
          teamB: { teamId: secondTeams[1]._id, sets: [] },
          winnerId: secondTeams[1]._id,
          loserId: secondTeams[0]._id,
        }),
      ],
    });

    const stats = aggregateStats([first, second]);

    expect(stats.teams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Alpha",
          matchesPlayed: 2,
          matchesWon: 1,
          matchesLost: 1,
          pointsFor: 19,
          pointsAgainst: 20,
          pointDiff: -1,
          winRate: 0.5,
        }),
      ]),
    );
    expect(stats.players).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Sam",
          matchesPlayed: 2,
          matchesWon: 1,
          matchesLost: 1,
          winRate: 0.5,
        }),
      ]),
    );
  });

  it("aggregates registered tournament players by player profile ID", () => {
    const samProfileId = new Types.ObjectId();
    const firstTeams = makeTeams(2);
    firstTeams[0].name = "Alpha";
    firstTeams[0].players = ["Sam Old"];
    firstTeams[0].playerProfileIds = [samProfileId];
    firstTeams[1].name = "Beta";
    firstTeams[1].players = ["Lee"];
    const secondTeams = makeTeams(2);
    secondTeams[0].name = "Gamma";
    secondTeams[0].players = ["Sam New"];
    secondTeams[0].playerProfileIds = [samProfileId];
    secondTeams[1].name = "Delta";
    secondTeams[1].players = ["Mia"];
    const first = tournament({
      teams: firstTeams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: firstTeams[0]._id, sets: [makeSet(11, 9)] },
          teamB: { teamId: firstTeams[1]._id, sets: [] },
          winnerId: firstTeams[0]._id,
          loserId: firstTeams[1]._id,
        }),
      ],
    });
    const second = tournament({
      teams: secondTeams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: secondTeams[0]._id, sets: [makeSet(8, 11)] },
          teamB: { teamId: secondTeams[1]._id, sets: [] },
          winnerId: secondTeams[1]._id,
          loserId: secondTeams[0]._id,
        }),
      ],
    });

    const stats = aggregateStats([first, second]);

    expect(stats.players.filter((row) => row.playerProfileId === samProfileId.toString())).toEqual([
      expect.objectContaining({
        playerProfileId: samProfileId.toString(),
        name: "Sam Old",
        matchesPlayed: 2,
        matchesWon: 1,
        matchesLost: 1,
        winRate: 0.5,
      }),
    ]);
  });

  it("filters tournament player stats by player profile reset rules", () => {
    const samProfileId = new Types.ObjectId();
    const teams = makeTeams(2);
    teams[0].players = ["Sam"];
    teams[0].playerProfileIds = [samProfileId];
    teams[1].players = ["Lee"];
    const cup = tournament({
      teams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: teams[0]._id, sets: [makeSet(11, 9)] },
          teamB: { teamId: teams[1]._id, sets: [] },
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
        }),
      ],
    });

    const stats = aggregateStats([cup], [
      {
        scope: "player",
        playerProfileId: samProfileId,
        playerNameKey: "unrelated",
      },
    ]);

    expect(stats.players.map((row) => row.name)).not.toContain("Sam");
    expect(stats.players.map((row) => row.name)).toContain("Lee");
  });

  it("sorts rows by wins, win rate, point difference, then name", () => {
    const teams = makeTeams(4);
    teams[0].name = "Alpha";
    teams[1].name = "Beta";
    teams[2].name = "Charlie";
    teams[3].name = "Delta";
    const cup = tournament({
      teams,
      matches: [
        makeMatch({
          status: "completed",
          teamA: { teamId: teams[0]._id, sets: [makeSet(11, 9)] },
          teamB: { teamId: teams[1]._id, sets: [] },
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
        }),
        makeMatch({
          status: "completed",
          teamA: { teamId: teams[2]._id, sets: [makeSet(21, 19)] },
          teamB: { teamId: teams[3]._id, sets: [] },
          winnerId: teams[2]._id,
          loserId: teams[3]._id,
        }),
      ],
    });

    const stats = aggregateStats([cup]);

    expect(stats.teams.map((row) => row.name)).toEqual([
      "Alpha",
      "Charlie",
      "Beta",
      "Delta",
    ]);
  });
});
