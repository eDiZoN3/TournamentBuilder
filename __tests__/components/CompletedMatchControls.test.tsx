// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeMatch, makeSet, makeTeams } from "@/__tests__/helpers/factories";
import { CompletedMatchControls } from "@/components/admin/CompletedMatchControls";

vi.mock("@/components/admin/ScoreEntry", () => ({
  ScoreEntry: ({
    mode,
    onClose,
  }: {
    mode: string;
    onClose: () => void;
  }) => (
    <div data-testid="score-entry">
      Score entry mode: {mode}
      <button onClick={onClose} type="button">
        Close override
      </button>
    </div>
  ),
}));

function completedMatch(overrides: Parameters<typeof makeMatch>[0] = {}) {
  const teams = makeTeams(2);

  return makeMatch({
    status: "completed",
    teamA: { teamId: teams[0]._id, sets: [makeSet(11, 9)] },
    teamB: { teamId: teams[1]._id, sets: [] },
    winnerId: teams[0]._id,
    loserId: teams[1]._id,
    ...overrides,
  });
}

describe("CompletedMatchControls", () => {
  it("opens score entry in override mode for completed non-bye matches", () => {
    const match = completedMatch();
    const onScoreEntryOpen = vi.fn();
    const onScoreEntryClose = vi.fn();

    render(
      <CompletedMatchControls
        match={match}
        onScoreEntryClose={onScoreEntryClose}
        onScoreEntryOpen={onScoreEntryOpen}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Override result" }));

    expect(onScoreEntryOpen).toHaveBeenCalledWith(match._id.toString());
    expect(screen.getByTestId("score-entry")).toHaveTextContent(
      "Score entry mode: override",
    );

    fireEvent.click(screen.getByRole("button", { name: "Close override" }));

    expect(onScoreEntryClose).toHaveBeenCalled();
  });

  it("is hidden for bye matches", () => {
    render(
      <CompletedMatchControls
        match={completedMatch({ isBye: true })}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Override result" }),
    ).not.toBeInTheDocument();
  });
});
