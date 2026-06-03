import { makeTeams } from "@/__tests__/helpers/factories";
import { generateTeamRoundRobinSchedule } from "@/lib/round-robin/teamSchedule";

function pairKey(first: { toString(): string }, second: { toString(): string }) {
  return [first.toString(), second.toString()].sort().join(":");
}

describe("generateTeamRoundRobinSchedule", () => {
  it("creates one ready match for two teams", () => {
    const teams = makeTeams(2);
    const matches = generateTeamRoundRobinSchedule(teams);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      bracket: "winner",
      format: "bo1",
      isBye: false,
      label: "Round 1",
      position: 1,
      round: 1,
      status: "ready",
    });
    expect(matches[0].teamA?.teamId.toString()).toBe(teams[0]._id.toString());
    expect(matches[0].teamB?.teamId.toString()).toBe(teams[1]._id.toString());
  });

  it("creates every unique team pair once with stable rounds", () => {
    const teams = makeTeams(4);
    const matches = generateTeamRoundRobinSchedule(teams);
    const pairs = matches.map((match) =>
      pairKey(match.teamA!.teamId, match.teamB!.teamId),
    );

    expect(matches).toHaveLength(6);
    expect(new Set(pairs).size).toBe(6);
    expect(matches.map((match) => [match.round, match.position])).toEqual([
      [1, 1],
      [1, 2],
      [2, 1],
      [2, 2],
      [3, 1],
      [3, 2],
    ]);
    expect(matches.every((match) => match.teamA!.teamId.toString() !== match.teamB!.teamId.toString())).toBe(true);
  });

  it("supports odd team counts without scored bye matches", () => {
    const teams = makeTeams(5);
    const matches = generateTeamRoundRobinSchedule(teams);
    const pairs = matches.map((match) =>
      pairKey(match.teamA!.teamId, match.teamB!.teamId),
    );

    expect(matches).toHaveLength(10);
    expect(new Set(pairs).size).toBe(10);
    expect(matches.some((match) => match.isBye)).toBe(false);
    expect(matches.every((match) => match.teamA && match.teamB)).toBe(true);
  });
});
