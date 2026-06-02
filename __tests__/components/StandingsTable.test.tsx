// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeMatch, makeTeams, makeTournament } from "@/__tests__/helpers/factories";
import { StandingsTable } from "@/components/bracket/StandingsTable";
import type { ITournament } from "@/lib/models/Tournament";

function completedTournament(overrides: Partial<ITournament>): ITournament {
  return {
    ...makeTournament({
      status: "completed",
    }),
    updatedAt: new Date(),
    ...overrides,
  } as ITournament;
}

describe("StandingsTable", () => {
  it("lists finals and loser-bracket elimination placements with players", () => {
    const teams = makeTeams(8).map((team, index) => ({
      ...team,
      players: [`Player ${index + 1}A`, `Player ${index + 1}B`],
    }));
    const tournament = completedTournament({
      teams,
      matches: [
        makeMatch({
          label: "WB Final",
          status: "completed",
          isWBFinal: true,
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
        }),
        makeMatch({
          bracket: "loser",
          label: "LB Final",
          status: "completed",
          isLBFinal: true,
          winnerId: teams[2]._id,
          loserId: teams[3]._id,
        }),
        makeMatch({
          bracket: "loser",
          round: 2,
          position: 1,
          placeRange: "5th-6th Place",
          status: "completed",
          loserId: teams[4]._id,
        }),
        makeMatch({
          bracket: "loser",
          round: 2,
          position: 2,
          placeRange: "5th-6th Place",
          status: "completed",
          loserId: teams[5]._id,
        }),
        makeMatch({
          bracket: "loser",
          round: 1,
          position: 1,
          placeRange: "7th-8th Place",
          status: "completed",
          loserId: teams[6]._id,
        }),
        makeMatch({
          bracket: "loser",
          round: 1,
          position: 2,
          placeRange: "7th-8th Place",
          status: "completed",
          loserId: teams[7]._id,
        }),
      ],
    });

    render(<StandingsTable tournament={tournament} />);

    expect(screen.getByRole("heading", { name: "Final standings" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(9);

    const firstPlace = screen.getByRole("row", { name: /1st Team A/ });
    const eighthPlace = screen.getByRole("row", { name: /8th Team H/ });

    expect(within(firstPlace).getByText("Player 1A, Player 1B")).toBeInTheDocument();
    expect(eighthPlace).toBeInTheDocument();
  });

  it("handles a two-team tournament without loser-bracket placements", () => {
    const teams = makeTeams(2);
    const tournament = completedTournament({
      teams,
      matches: [
        makeMatch({
          label: "WB Final",
          status: "completed",
          isWBFinal: true,
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
        }),
      ],
    });

    render(<StandingsTable tournament={tournament} />);

    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByRole("row", { name: /1st Team A/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /2nd Team B/ })).toBeInTheDocument();
    expect(screen.queryByText("3rd")).not.toBeInTheDocument();
  });
});
