import { afterEach, describe, expect, it, vi } from "vitest";
import { assignPlayersToTeams } from "@/lib/bracket/playerAssign";

function players(count: number) {
  return Array.from({ length: count }, (_, index) => `Player ${index + 1}`);
}

describe("assignPlayersToTeams", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shuffles and splits an evenly divisible player list", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);

    const teams = assignPlayersToTeams(players(8), 2);

    expect(teams.map((team) => team.name)).toEqual([
      "Team A",
      "Team B",
      "Team C",
      "Team D",
    ]);
    expect(teams.map((team) => team.players)).toEqual([
      ["Player 1", "Player 2"],
      ["Player 3", "Player 4"],
      ["Player 5", "Player 6"],
      ["Player 7", "Player 8"],
    ]);
  });

  it("appends remainder players to the last full team", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);

    const teams = assignPlayersToTeams(players(7), 3);

    expect(teams.map((team) => team.players.length)).toEqual([3, 4]);
    expect(teams[1].players).toEqual([
      "Player 4",
      "Player 5",
      "Player 6",
      "Player 7",
    ]);
  });

  it("appends a single leftover player to the last team", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);

    const teams = assignPlayersToTeams(players(9), 4);

    expect(teams.map((team) => team.players.length)).toEqual([4, 5]);
  });

  it("returns one larger team when there are not enough players for two teams", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);

    const teams = assignPlayersToTeams(players(5), 4);

    expect(teams).toHaveLength(1);
    expect(teams[0].players).toHaveLength(5);
  });

  it("rejects assignments that would create a team with fewer than two players", () => {
    expect(() => assignPlayersToTeams(["Solo"], 2)).toThrow(
      "Each team must have at least 2 players",
    );
  });

  it("rejects empty player names", () => {
    expect(() => assignPlayersToTeams(["Alpha", " "], 2)).toThrow(
      "Player names cannot be empty",
    );
  });
});

