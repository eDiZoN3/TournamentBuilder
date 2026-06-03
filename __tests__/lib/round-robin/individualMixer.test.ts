import { generateIndividualMixerSchedule } from "@/lib/round-robin/individualMixer";

function playersForMatch(
  teams: ReturnType<typeof generateIndividualMixerSchedule>["teams"],
  match: ReturnType<typeof generateIndividualMixerSchedule>["matches"][number],
) {
  const teamA = teams.find(
    (team) => team._id.toString() === match.teamA?.teamId.toString(),
  );
  const teamB = teams.find(
    (team) => team._id.toString() === match.teamB?.teamId.toString(),
  );

  return [...(teamA?.players ?? []), ...(teamB?.players ?? [])];
}

describe("generateIndividualMixerSchedule", () => {
  it("creates temporary teams and a rotating match per round", () => {
    const schedule = generateIndividualMixerSchedule(
      ["Alice", "Bob", "Charlie", "Dana"],
      2,
    );

    expect(schedule.matches).toHaveLength(3);
    expect(schedule.teams).toHaveLength(6);
    expect(schedule.matches.map((match) => match.label)).toEqual([
      "Round 1",
      "Round 2",
      "Round 3",
    ]);
    expect(schedule.matches.every((match) => match.status === "ready")).toBe(true);
    expect(schedule.teams.every((team) => team.players)).toEqual(true);
  });

  it("never assigns the same player twice in one match", () => {
    const schedule = generateIndividualMixerSchedule(
      ["Alice", "Bob", "Charlie", "Dana", "Evan"],
      2,
    );

    for (const match of schedule.matches) {
      const players = playersForMatch(schedule.teams, match);

      expect(players).toHaveLength(4);
      expect(new Set(players).size).toBe(players.length);
    }
  });

  it("varies partners where possible", () => {
    const schedule = generateIndividualMixerSchedule(
      ["Alice", "Bob", "Charlie", "Dana"],
      2,
    );
    const alicePartners = new Set<string>();

    for (const match of schedule.matches) {
      const team = schedule.teams.find(
        (candidate) =>
          (candidate._id.toString() === match.teamA?.teamId.toString() ||
            candidate._id.toString() === match.teamB?.teamId.toString()) &&
          candidate.players.includes("Alice"),
      );

      team?.players
        .filter((player) => player !== "Alice")
        .forEach((player) => alicePartners.add(player));
    }

    expect(alicePartners.size).toBeGreaterThan(1);
  });

  it("keeps participation balanced when players sit out because of remainders", () => {
    const schedule = generateIndividualMixerSchedule(
      ["Alice", "Bob", "Charlie", "Dana", "Evan", "Finley"],
      2,
    );
    const counts = new Map<string, number>();

    for (const match of schedule.matches) {
      for (const player of playersForMatch(schedule.teams, match)) {
        counts.set(player, (counts.get(player) ?? 0) + 1);
      }
    }

    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThanOrEqual(1);
  });
});
