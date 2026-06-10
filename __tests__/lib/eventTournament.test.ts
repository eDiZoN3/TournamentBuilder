import { describe, expect, it } from "vitest";
import {
  makeTeams,
  makeTournament,
} from "@/__tests__/helpers/factories";
import {
  deriveEventConfig,
  generateEventTournamentMatches,
  planEventSlots,
  toggleEventMatchWinner,
} from "@/lib/eventTournament";
import type { IMatch, ITeam, ITournament } from "@/lib/models/Tournament";

function seedByTeamId(teams: ITeam[]) {
  return new Map(teams.map((team) => [team._id.toString(), team.seed]));
}

describe("event tournament helpers", () => {
  it("derives bracket size and bye quotas from participant and discipline counts", () => {
    expect(deriveEventConfig(13, 5)).toEqual({
      participantCount: 13,
      disciplineCount: 5,
      bracketSize: 16,
      byeCount: 3,
      roundCount: 4,
      byePoolSize: 5,
      byeQuotas: [3, 3, 3, 3, 3],
    });
  });

  it("generates one single-elimination bracket per discipline with rotated byes", () => {
    const teams = makeTeams(13) as ITeam[];
    const matches = generateEventTournamentMatches(
      teams,
      ["Darts", "Quiz", "Cards", "Skill", "Puzzle"],
      123,
    );
    const seeds = seedByTeamId(teams);
    const byeCounts = new Map<number, number>();

    for (const match of matches.filter((match) => match.isBye)) {
      const winnerSeed = seeds.get(match.winnerId?.toString() ?? "");

      if (winnerSeed) {
        byeCounts.set(winnerSeed, (byeCounts.get(winnerSeed) ?? 0) + 1);
      }
    }

    expect(matches).toHaveLength(75);
    expect(byeCounts).toEqual(
      new Map([
        [1, 3],
        [2, 3],
        [3, 3],
        [4, 3],
        [5, 3],
      ]),
    );

    for (let index = 0; index < 5; index += 1) {
      const disciplineMatches = matches.filter(
        (match) => match.eventDisciplineIndex === index,
      );

      expect(disciplineMatches).toHaveLength(15);
      expect(disciplineMatches.filter((match) => match.isBye)).toHaveLength(3);
      expect(disciplineMatches.filter((match) => !match.isBye)).toHaveLength(12);
      expect(
        disciplineMatches.every(
          (match) => match.eventDisciplineName === ["Darts", "Quiz", "Cards", "Skill", "Puzzle"][index],
        ),
      ).toBe(true);
    }
  });

  it("avoids first-round pair repeats across disciplines when possible", () => {
    const teams = makeTeams(8) as ITeam[];
    const matches = generateEventTournamentMatches(
      teams,
      ["Darts", "Quiz", "Cards"],
      99,
    );
    const seeds = seedByTeamId(teams);
    const firstRoundPairKeys = matches
      .filter(
        (match) =>
          match.round === 1 &&
          !match.isBye &&
          Boolean(match.teamA) &&
          Boolean(match.teamB),
      )
      .map((match) => {
        const pair = [
          seeds.get(match.teamA!.teamId.toString()),
          seeds.get(match.teamB!.teamId.toString()),
        ].sort((first, second) => (first ?? 0) - (second ?? 0));

        return pair.join("-");
      });

    expect(new Set(firstRoundPairKeys).size).toBe(firstRoundPairKeys.length);
  });

  it("plans playable slots without participant or discipline conflicts", () => {
    const teams = makeTeams(8) as ITeam[];
    const matches = generateEventTournamentMatches(
      teams,
      ["Darts", "Quiz", "Cards"],
      99,
    );
    const slots = planEventSlots(matches);
    const plannedMatches = slots.flatMap((slot) => slot.matches);

    expect(plannedMatches).toHaveLength(12);

    for (const slot of slots) {
      const participantIds = new Set<string>();
      const disciplineIndexes = new Set<number>();

      for (const match of slot.matches) {
        expect(disciplineIndexes.has(match.eventDisciplineIndex!)).toBe(false);
        disciplineIndexes.add(match.eventDisciplineIndex!);

        for (const teamId of [
          match.teamA?.teamId.toString(),
          match.teamB?.teamId.toString(),
        ]) {
          expect(teamId).toBeTruthy();
          expect(participantIds.has(teamId!)).toBe(false);
          participantIds.add(teamId!);
        }
      }
    }
  });

  it("toggles winners, advances them, and resets downstream event matches", () => {
    const teams = makeTeams(4) as ITeam[];
    const matches = generateEventTournamentMatches(teams, ["Darts"], 1);
    const tournament = makeTournament({
      format: "event",
      matchResultMode: "winner_only",
      status: "active",
      teams,
      matches: matches as IMatch[],
    }) as ITournament;
    const firstRound = tournament.matches
      .filter((match) => match.round === 1)
      .sort((first, second) => first.position - second.position);
    const final = tournament.matches.find((match) => match.round === 2)!;
    const firstWinner = firstRound[0].teamA!.teamId;
    const firstReplacement = firstRound[0].teamB!.teamId;
    const secondWinner = firstRound[1].teamA!.teamId;

    toggleEventMatchWinner(tournament, firstRound[0], firstWinner);
    toggleEventMatchWinner(tournament, firstRound[1], secondWinner);

    expect(final.status).toBe("ready");
    expect([final.teamA?.teamId.toString(), final.teamB?.teamId.toString()]).toEqual(
      expect.arrayContaining([firstWinner.toString(), secondWinner.toString()]),
    );

    toggleEventMatchWinner(tournament, final, firstWinner);
    expect(tournament.status).toBe("completed");

    toggleEventMatchWinner(tournament, firstRound[0], firstReplacement);
    expect(tournament.status).toBe("active");
    expect(firstRound[0].winnerId?.toString()).toBe(firstReplacement.toString());
    expect(final.status).toBe("ready");
    expect(final.winnerId).toBeNull();
    expect([final.teamA?.teamId.toString(), final.teamB?.teamId.toString()]).toEqual(
      expect.arrayContaining([firstReplacement.toString(), secondWinner.toString()]),
    );

    toggleEventMatchWinner(tournament, firstRound[0], firstReplacement);
    expect(firstRound[0].status).toBe("ready");
    expect(firstRound[0].winnerId).toBeNull();
    expect(final.status).toBe("pending");
  });
});
