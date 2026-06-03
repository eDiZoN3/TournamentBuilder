import { Tournament } from "@/lib/models/Tournament";

describe("Tournament model", () => {
  it("creates a draft tournament with empty embedded collections", async () => {
    const tournament = await Tournament.create({
      name: "Summer Cup",
      teamSize: 2,
      courtsAvailable: 3,
      inputMode: "teams",
    });

    expect(tournament).toMatchObject({
      name: "Summer Cup",
      status: "draft",
      format: "double_elimination",
      teamSize: 2,
      courtsAvailable: 3,
      inputMode: "teams",
      teams: [],
      matches: [],
      currentMatchIds: [],
    });
  });

  it.each(["team_round_robin", "individual_mixer"] as const)(
    "accepts the %s tournament format",
    async (format) => {
      const tournament = await Tournament.create({
        name: "Format Cup",
        format,
        teamSize: 2,
        courtsAvailable: 2,
        inputMode: format === "team_round_robin" ? "teams" : "players",
      });

      expect(tournament.format).toBe(format);
    },
  );

  it("rejects unknown tournament formats", async () => {
    await expect(
      Tournament.create({
        name: "Bad Format Cup",
        format: "single_elimination",
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "teams",
      }),
    ).rejects.toThrow();
  });

  it("rejects tournaments with invalid court counts", async () => {
    await expect(
      Tournament.create({
        name: "No Court Cup",
        teamSize: 2,
        courtsAvailable: 0,
        inputMode: "teams",
      }),
    ).rejects.toThrow();

    await expect(
      Tournament.create({
        name: "Too Many Courts Cup",
        teamSize: 2,
        courtsAvailable: 11,
        inputMode: "teams",
      }),
    ).rejects.toThrow();
  });

  it("rejects team names longer than 50 characters", async () => {
    await expect(
      Tournament.create({
        name: "Summer Cup",
        teamSize: 2,
        courtsAvailable: 1,
        inputMode: "teams",
        teams: [
          {
            name: "A".repeat(51),
            players: [],
            seed: 0,
          },
        ],
      }),
    ).rejects.toThrow();
  });

  it("declares an index for tournament status", () => {
    expect(Tournament.schema.indexes()).toContainEqual([
      { status: 1 },
      { background: true },
    ]);
  });
});
