import { TournamentGroup } from "@/lib/models/TournamentGroup";
import { Types } from "mongoose";

describe("TournamentGroup model", () => {
  it("creates a draft group with the required name", async () => {
    const group = await TournamentGroup.create({ name: "Volleyball Cup" });
    expect(group.name).toBe("Volleyball Cup");
    expect(group.status).toBe("draft");
  });

  it("defaults teams and categories to empty arrays", async () => {
    const group = await TournamentGroup.create({ name: "Cup" });
    expect(group.teams).toEqual([]);
    expect(group.categories).toEqual([]);
  });

  it("persists a category with name, position, and null currentMatchId", async () => {
    const group = await TournamentGroup.create({
      name: "Cup",
      categories: [{ name: "Category A", position: 0 }],
    });
    expect(group.categories).toHaveLength(1);
    expect(group.categories[0].name).toBe("Category A");
    expect(group.categories[0].position).toBe(0);
    expect(group.categories[0].currentMatchId).toBeNull();
    expect(group.categories[0].matches).toEqual([]);
  });

  it("stores multiple categories ordered by position", async () => {
    const group = await TournamentGroup.create({
      name: "Cup",
      categories: [
        { name: "Category B", position: 1 },
        { name: "Category A", position: 0 },
      ],
    });
    expect(group.categories).toHaveLength(2);
  });

  it("round-trips embedded match fields", async () => {
    const teamAId = new Types.ObjectId();
    const teamBId = new Types.ObjectId();

    const group = await TournamentGroup.create({
      name: "Cup",
      categories: [
        {
          name: "Category A",
          position: 0,
          matches: [
            {
              bracket: "winner",
              round: 1,
              position: 0,
              label: "Round 1",
              placeRange: "",
              format: "bo1",
              teamA: { teamId: teamAId, sets: [] },
              teamB: { teamId: teamBId, sets: [] },
              status: "ready",
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
      ],
    });

    const cat = group.categories[0];
    expect(cat.matches).toHaveLength(1);
    const m = cat.matches[0];
    expect(m.round).toBe(1);
    expect(m.position).toBe(0);
    expect(m.label).toBe("Round 1");
    expect(m.status).toBe("ready");
    expect(m.teamA!.teamId.toString()).toBe(teamAId.toString());
    expect(m.teamB!.teamId.toString()).toBe(teamBId.toString());
    expect(m.isBye).toBe(false);
    expect(m.isWBFinal).toBe(false);
    expect(m.courtNumber).toBeNull();
  });

  it("stores teams with name and seed", async () => {
    const group = await TournamentGroup.create({
      name: "Cup",
      teams: [
        { name: "Team Alpha", players: ["Alice", "Bob"], seed: 1 },
        { name: "Team Beta", players: ["Carol"], seed: 2 },
      ],
    });
    expect(group.teams).toHaveLength(2);
    expect(group.teams[0].name).toBe("Team Alpha");
    expect(group.teams[0].seed).toBe(1);
  });

  it("auto-sets createdAt timestamp", async () => {
    const before = new Date();
    const group = await TournamentGroup.create({ name: "Cup" });
    expect(group.createdAt).toBeInstanceOf(Date);
    expect(group.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it("rejects creation without a name", async () => {
    await expect(TournamentGroup.create({})).rejects.toThrow();
  });

  it("allows status to be set to active", async () => {
    const group = await TournamentGroup.create({
      name: "Cup",
      status: "active",
    });
    expect(group.status).toBe("active");
  });
});
