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
  it("derives weighted bye quotas from participant seed order", () => {
    expect(deriveEventConfig(5, 4)).toEqual({
      participantCount: 5,
      disciplineCount: 4,
      bracketSize: 8,
      byeCount: 3,
      roundCount: 3,
      byePoolSize: 5,
      byeQuotas: [4, 3, 3, 2, 0],
    });

    expect(deriveEventConfig(13, 5)).toEqual({
      participantCount: 13,
      disciplineCount: 5,
      bracketSize: 16,
      byeCount: 3,
      roundCount: 4,
      byePoolSize: 13,
      byeQuotas: [2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0],
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
        [1, 2],
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
        [6, 1],
        [7, 1],
        [8, 1],
        [9, 1],
        [10, 1],
      ]),
    );
    expect(byeCounts.get(13) ?? 0).toBe(0);

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


  it("keeps the last seed to at most one bye across all disciplines", () => {
    const teams = makeTeams(5) as ITeam[];
    const matches = generateEventTournamentMatches(
      teams,
      ["Darts", "Quiz", "Cards", "Skill"],
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

    expect(byeCounts).toEqual(
      new Map([
        [1, 4],
        [2, 3],
        [3, 3],
        [4, 2],
      ]),
    );
    expect(byeCounts.get(5) ?? 0).toBeLessThanOrEqual(1);

    for (let index = 0; index < 4; index += 1) {
      const disciplineByes = matches.filter(
        (match) => match.eventDisciplineIndex === index && match.isBye,
      );
      const byeTeamIds = disciplineByes.map((match) =>
        match.winnerId?.toString(),
      );

      expect(disciplineByes).toHaveLength(3);
      expect(new Set(byeTeamIds).size).toBe(byeTeamIds.length);
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


  it("rotates bracket layouts between event disciplines", () => {
    const teams = makeTeams(8) as ITeam[];
    const matches = generateEventTournamentMatches(
      teams,
      ["Darts", "Quiz", "Cards", "Skill"],
      99,
    );
    const seeds = seedByTeamId(teams);
    const layoutSignatures = new Set<string>();
    const topSeedPositions = new Set<number>();

    for (let index = 0; index < 4; index += 1) {
      const firstRound = matches
        .filter(
          (match) => match.eventDisciplineIndex === index && match.round === 1,
        )
        .sort((first, second) => first.position - second.position);

      layoutSignatures.add(
        firstRound
          .map((match) => {
            const firstSeed = seeds.get(match.teamA!.teamId.toString());
            const secondSeed = seeds.get(match.teamB!.teamId.toString());

            return `${firstSeed}-${secondSeed}`;
          })
          .join("|"),
      );

      const topSeedMatch = firstRound.find(
        (match) => seeds.get(match.teamA!.teamId.toString()) === 1 ||
          seeds.get(match.teamB!.teamId.toString()) === 1,
      );
      topSeedPositions.add(topSeedMatch!.position);
    }

    expect(layoutSignatures.size).toBe(4);
    expect(topSeedPositions.size).toBeGreaterThan(1);
  });

  it("minimizes unavoidable first-round repeats when byes differ by seed", () => {
    const teams = makeTeams(5) as ITeam[];
    const matches = generateEventTournamentMatches(
      teams,
      ["Darts", "Quiz", "Cards", "Skill"],
      123,
    );
    const seeds = seedByTeamId(teams);
    const pairCounts = new Map<string, number>();

    for (const match of matches.filter(
      (match) => match.round === 1 && !match.isBye,
    )) {
      const pair = [
        seeds.get(match.teamA!.teamId.toString()),
        seeds.get(match.teamB!.teamId.toString()),
      ]
        .sort((first, second) => (first ?? 0) - (second ?? 0))
        .join("-");

      pairCounts.set(pair, (pairCounts.get(pair) ?? 0) + 1);
    }

    expect(pairCounts.size).toBe(3);
    expect(Math.max(...pairCounts.values())).toBe(2);
    expect(pairCounts.has("2-5")).toBe(true);
    expect(pairCounts.has("3-5")).toBe(true);
    expect(pairCounts.has("4-5")).toBe(true);
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



  it("prioritizes event matches that improve total flow over strict round order", () => {
    const teams = makeTeams(8) as ITeam[];
    const matches = generateEventTournamentMatches(teams, ["Darts", "Quiz"], 99);
    const tournament = makeTournament({
      format: "event",
      matchResultMode: "winner_only",
      status: "active",
      teams,
      matches: matches as IMatch[],
    }) as ITournament;
    const dartsRoundOne = tournament.matches
      .filter(
        (match) => match.eventDisciplineIndex === 0 && match.round === 1,
      )
      .sort((first, second) => first.position - second.position);

    toggleEventMatchWinner(tournament, dartsRoundOne[0], dartsRoundOne[0].teamA!.teamId);
    toggleEventMatchWinner(tournament, dartsRoundOne[1], dartsRoundOne[1].teamA!.teamId);
    toggleEventMatchWinner(tournament, dartsRoundOne[2], dartsRoundOne[2].teamA!.teamId);
    toggleEventMatchWinner(tournament, dartsRoundOne[3], dartsRoundOne[3].teamA!.teamId);

    const dartsRoundTwo = tournament.matches
      .filter(
        (match) =>
          match.eventDisciplineIndex === 0 &&
          match.round === 2 &&
          match.status === "ready",
      )
      .sort((first, second) => first.position - second.position);

    toggleEventMatchWinner(tournament, dartsRoundTwo[0], dartsRoundTwo[0].teamA!.teamId);

    const unlockedDartsRoundTwo = dartsRoundTwo[1];
    const slots = planEventSlots(tournament.matches);

    expect(slots[0].matches[0]._id.toString()).toBe(
      unlockedDartsRoundTwo._id.toString(),
    );
  });

  it("keeps pinned direct next event matches stable while recalculating later slots", () => {
    const teams = makeTeams(8) as ITeam[];
    const matches = generateEventTournamentMatches(teams, ["Darts", "Quiz"], 99);
    const tournament = makeTournament({
      format: "event",
      matchResultMode: "winner_only",
      status: "active",
      teams,
      matches: matches as IMatch[],
    }) as ITournament;
    const originalDirectMatch = tournament.matches.find(
      (match) =>
        match.eventDisciplineIndex === 1 &&
        match.round === 1 &&
        match.status === "ready",
    )!;
    const dartsRoundOne = tournament.matches
      .filter(
        (match) => match.eventDisciplineIndex === 0 && match.round === 1,
      )
      .sort((first, second) => first.position - second.position);

    toggleEventMatchWinner(tournament, dartsRoundOne[0], dartsRoundOne[0].teamA!.teamId);
    toggleEventMatchWinner(tournament, dartsRoundOne[1], dartsRoundOne[1].teamA!.teamId);

    const slots = planEventSlots(tournament.matches, {
      pinnedFirstSlotMatchIds: [originalDirectMatch._id.toString()],
    });

    expect(slots[0].matches.map((match) => match._id.toString())).toContain(
      originalDirectMatch._id.toString(),
    );
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
