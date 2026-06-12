// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeSet, makeTeams } from "@/__tests__/helpers/factories";
import { CompletedMatchControls } from "@/components/admin/CompletedMatchControls";
import { ToastProvider } from "@/components/ui/Toast";

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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("CompletedMatchControls", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

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

  it("notifies the parent when an open score entry unmounts", () => {
    const match = completedMatch();
    const onScoreEntryClose = vi.fn();
    const { unmount } = render(
      <CompletedMatchControls
        match={match}
        onScoreEntryClose={onScoreEntryClose}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Override result" }));
    unmount();

    expect(onScoreEntryClose).toHaveBeenCalled();
  });

  it("submits winner-only overrides and closes the chooser", async () => {
    const match = completedMatch();
    const onUpdated = vi.fn();
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        winnerChanged: true,
      }),
    );
    vi.stubGlobal("fetch", fetch);

    render(
      <ToastProvider>
        <CompletedMatchControls
          match={match}
          matchResultMode="winner_only"
          onUpdated={onUpdated}
          teamAName="Alpha"
          teamBName="Beta"
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Override result" }));
    fireEvent.click(screen.getByRole("button", { name: "Beta won" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/override$/),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ winnerSide: "B" }),
        }),
      );
      expect(onUpdated).toHaveBeenCalled();
    });
    expect(screen.queryByRole("button", { name: "Beta won" })).not.toBeInTheDocument();
    expect(await screen.findByText("Match overridden")).toBeInTheDocument();
  });

  it("shows an error toast when winner-only override is rejected", async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({}, 409));
    vi.stubGlobal("fetch", fetch);

    render(
      <ToastProvider>
        <CompletedMatchControls
          match={completedMatch()}
          matchResultMode="winner_only"
          onUpdated={vi.fn()}
          teamAName="Alpha"
          teamBName="Beta"
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Override result" }));
    fireEvent.click(screen.getByRole("button", { name: "Alpha won" }));

    expect(await screen.findAllByText("Unable to override match.")).not.toHaveLength(0);
  });

  it("shows an error toast when winner-only override throws", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("Network down"));
    vi.stubGlobal("fetch", fetch);

    render(
      <ToastProvider>
        <CompletedMatchControls
          match={completedMatch()}
          matchResultMode="winner_only"
          onUpdated={vi.fn()}
          teamAName="Alpha"
          teamBName="Beta"
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Override result" }));
    fireEvent.click(screen.getByRole("button", { name: "Alpha won" }));

    expect(await screen.findAllByText("Unable to override match.")).not.toHaveLength(0);
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

  it("is hidden for matches that are no longer completed", () => {
    render(
      <CompletedMatchControls
        match={completedMatch({ status: "in_progress" })}
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
