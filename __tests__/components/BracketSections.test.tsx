// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeMatch, makeTeams } from "@/__tests__/helpers/factories";
import { LoserBracket } from "@/components/bracket/LoserBracket";
import { UpNextBanner } from "@/components/bracket/UpNextBanner";
import { WinnerBracket } from "@/components/bracket/WinnerBracket";

describe("WinnerBracket", () => {
  it("groups winner matches by round and resolves team names", () => {
    const teams = makeTeams(3);
    const matches = [
      makeMatch({
        bracket: "winner",
        round: 2,
        label: "WB Final",
        teamA: { teamId: teams[2]._id, sets: [] },
      }),
      makeMatch({
        bracket: "loser",
        label: "LB Final",
      }),
      makeMatch({
        bracket: "winner",
        round: 1,
        label: "WB Round 1",
        status: "ready",
        teamA: { teamId: teams[0]._id, sets: [] },
        teamB: { teamId: teams[1]._id, sets: [] },
      }),
    ];

    render(<WinnerBracket matches={matches} teams={teams} />);

    expect(screen.getByRole("heading", { name: "Winner bracket" })).toBeInTheDocument();
    expect(screen.getAllByTestId("winner-round")).toHaveLength(2);
    expect(screen.getByText("Team A")).toBeInTheDocument();
    expect(screen.getByText("Team B")).toBeInTheDocument();
    expect(screen.queryByText("LB Final")).not.toBeInTheDocument();
  });

  it("renders round tabs and marks inactive mobile rounds as hidden", () => {
    const matches = [
      makeMatch({ bracket: "winner", round: 1, label: "WB Round 1" }),
      makeMatch({ bracket: "winner", round: 2, label: "WB Final" }),
    ];

    render(<WinnerBracket matches={matches} teams={[]} />);

    const tabs = screen.getByRole("group", { name: "Winner bracket rounds" });

    expect(within(tabs).getByRole("button", { name: "Round 1" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(within(tabs).getByRole("button", { name: "Final" }));

    expect(screen.getAllByTestId("winner-round")[0]).toHaveClass("hidden");
    expect(screen.getAllByTestId("winner-round")[1]).toHaveClass("block");
  });
});

describe("LoserBracket", () => {
  it("groups loser matches into alternating rounds and keeps the final visible", () => {
    const teams = makeTeams(2);
    const matches = [
      makeMatch({
        bracket: "loser",
        round: 3,
        label: "LB Final",
        isLBFinal: true,
        teamA: { teamId: teams[0]._id, sets: [] },
      }),
      makeMatch({
        bracket: "winner",
        label: "WB Round 1",
      }),
      makeMatch({
        bracket: "loser",
        round: 1,
        label: "LB Round 1",
        teamA: { teamId: teams[1]._id, sets: [] },
      }),
      makeMatch({
        bracket: "loser",
        round: 2,
        label: "LB Round 2",
      }),
    ];

    render(<LoserBracket matches={matches} teams={teams} />);

    expect(screen.getByRole("heading", { name: "Loser bracket" })).toBeInTheDocument();
    expect(screen.getAllByTestId("loser-round")).toHaveLength(3);
    expect(
      screen.getByRole("heading", { level: 3, name: "LB Final" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("WB Round 1")).not.toBeInTheDocument();
  });

  it("does not render an empty loser bracket for a two-team tournament", () => {
    render(<LoserBracket matches={[]} teams={[]} />);

    expect(screen.queryByRole("heading", { name: "Loser bracket" })).not.toBeInTheDocument();
  });

  it("renders loser-bracket round tabs", () => {
    const matches = [
      makeMatch({ bracket: "loser", round: 1, label: "LB Round 1" }),
      makeMatch({ bracket: "loser", round: 2, label: "LB Final", isLBFinal: true }),
    ];

    render(<LoserBracket matches={matches} teams={[]} />);

    const tabs = screen.getByRole("group", { name: "Loser bracket rounds" });

    expect(within(tabs).getByRole("button", { name: "Round 1" })).toBeInTheDocument();
    expect(within(tabs).getByRole("button", { name: "Final" })).toBeInTheDocument();
  });
});

describe("UpNextBanner", () => {
  it("shows at most three ready non-bye matches in WB-first round order", () => {
    const teams = makeTeams(2);
    const slotA = { teamId: teams[0]._id, sets: [] };
    const slotB = { teamId: teams[1]._id, sets: [] };
    const matches = [
      makeMatch({
        bracket: "loser",
        round: 1,
        position: 1,
        label: "LB First",
        status: "ready",
        teamA: slotA,
        teamB: slotB,
      }),
      makeMatch({
        bracket: "winner",
        round: 2,
        position: 1,
        label: "WB Later",
        status: "ready",
        teamA: slotA,
        teamB: slotB,
      }),
      makeMatch({
        bracket: "winner",
        round: 1,
        position: 2,
        label: "WB Second",
        status: "ready",
        teamA: slotA,
        teamB: slotB,
      }),
      makeMatch({
        bracket: "winner",
        round: 1,
        position: 1,
        label: "WB First",
        status: "ready",
        teamA: slotA,
        teamB: slotB,
      }),
      makeMatch({
        bracket: "winner",
        round: 1,
        position: 3,
        label: "Skipped Bye",
        status: "ready",
        isBye: true,
        teamA: slotA,
      }),
      makeMatch({
        bracket: "winner",
        round: 1,
        position: 4,
        label: "Skipped Pending",
        status: "pending",
      }),
    ];

    render(<UpNextBanner matches={matches} teams={teams} />);

    const entries = screen.getAllByTestId("up-next-match");

    expect(entries).toHaveLength(3);
    expect(entries.map((entry) => within(entry).getByRole("heading").textContent)).toEqual([
      "WB First",
      "WB Second",
      "WB Later",
    ]);
    expect(screen.queryByText("LB First")).not.toBeInTheDocument();
    expect(screen.getAllByText("Team A vs Team B")).toHaveLength(3);
  });

  it("is hidden when no matches are ready", () => {
    render(<UpNextBanner matches={[makeMatch()]} teams={[]} />);

    expect(screen.queryByText("Up next")).not.toBeInTheDocument();
  });
});
