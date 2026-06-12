// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeTeams } from "@/__tests__/helpers/factories";
import { MatchControls } from "@/components/admin/MatchControls";
import { ToastProvider } from "@/components/ui/Toast";

vi.mock("@/components/admin/ScoreEntry", () => ({
  ScoreEntry: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="score-entry">
      Score modal
      <button onClick={onClose} type="button">
        Close score modal
      </button>
    </div>
  ),
}));

vi.mock("@/components/admin/CourtOverrideControls", () => ({
  CourtOverrideControls: () => (
    <div data-testid="court-override">Court override</div>
  ),
}));

vi.mock("@/components/admin/CompletedMatchControls", () => ({
  CompletedMatchControls: ({
    teamAName,
    teamBName,
  }: {
    teamAName: string;
    teamBName: string;
  }) => (
    <div data-testid="completed-controls">
      {teamAName} vs {teamBName}
    </div>
  ),
}));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("MatchControls", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("is hidden for pending and bye matches", () => {
    const { rerender } = render(
      <MatchControls
        courtsAvailable={1}
        currentMatchIds={[]}
        match={makeMatch()}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    expect(screen.queryByTestId("match-controls")).not.toBeInTheDocument();

    rerender(
      <MatchControls
        courtsAvailable={1}
        currentMatchIds={[]}
        match={makeMatch({ isBye: true, status: "completed" })}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    expect(screen.queryByTestId("match-controls")).not.toBeInTheDocument();
  });

  it("disables court assignment when every court is occupied", () => {
    const match = makeMatch({ status: "ready" });

    render(
      <MatchControls
        courtsAvailable={2}
        currentMatchIds={[makeMatch()._id, makeMatch()._id]}
        match={match}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Mark as in progress" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Mark as in progress" }),
    ).toHaveAttribute("title", "All courts occupied");
    expect(screen.getByTestId("court-override")).toBeInTheDocument();
  });

  it("hides manual court override for one-court ready matches", () => {
    render(
      <MatchControls
        courtsAvailable={1}
        currentMatchIds={[]}
        match={makeMatch({ status: "ready" })}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Mark as in progress" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("court-override")).not.toBeInTheDocument();
  });

  it("delegates completed matches to the completed-match controls", () => {
    const teams = makeTeams(2);

    render(
      <MatchControls
        courtsAvailable={1}
        currentMatchIds={[]}
        match={makeMatch({
          status: "completed",
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[1]._id, sets: [] },
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
        })}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    expect(screen.getByTestId("completed-controls")).toHaveTextContent(
      "Alpha vs Beta",
    );
  });

  it("marks a ready match in progress", async () => {
    const onUpdated = vi.fn();
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        status: "in_progress",
        courtNumber: 1,
      }),
    );
    vi.stubGlobal("fetch", fetch);

    render(
      <MatchControls
        courtsAvailable={1}
        currentMatchIds={[]}
        match={makeMatch({ status: "ready" })}
        onUpdated={onUpdated}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Mark as in progress" }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/status$/),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ status: "in_progress" }),
        }),
      );
      expect(onUpdated).toHaveBeenCalled();
    });
  });

  it("opens score entry for an in-progress match", () => {
    const teams = makeTeams(2);

    render(
      <MatchControls
        courtsAvailable={1}
        currentMatchIds={[]}
        match={makeMatch({
          status: "in_progress",
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[1]._id, sets: [] },
        })}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Enter scores" }));

    expect(screen.getByTestId("score-entry")).toBeInTheDocument();
  });

  it("completes winner-only matches by selecting a winner", async () => {
    const teams = makeTeams(2);
    const match = makeMatch({
      status: "in_progress",
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const onUpdated = vi.fn();
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        status: "completed",
        winnerId: teams[1]._id.toString(),
      }),
    );
    vi.stubGlobal("fetch", fetch);

    render(
      <MatchControls
        courtsAvailable={1}
        currentMatchIds={[]}
        match={match}
        matchResultMode="winner_only"
        onUpdated={onUpdated}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    expect(screen.queryByRole("button", { name: "Enter scores" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Beta won" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/status$/),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            status: "completed",
            winnerSide: "B",
          }),
        }),
      );
      expect(onUpdated).toHaveBeenCalled();
    });
  });

  it("hides manual court override for one-court in-progress matches", () => {
    const teams = makeTeams(2);

    render(
      <MatchControls
        courtsAvailable={1}
        currentMatchIds={[]}
        match={makeMatch({
          status: "in_progress",
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[1]._id, sets: [] },
        })}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    expect(screen.getByRole("button", { name: "Enter scores" })).toBeInTheDocument();
    expect(screen.queryByTestId("court-override")).not.toBeInTheDocument();
  });

  it("notifies the parent while score entry is pinned and when it closes", () => {
    const teams = makeTeams(2);
    const match = makeMatch({
      status: "in_progress",
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const onScoreEntryClose = vi.fn();
    const onScoreEntryOpen = vi.fn();

    render(
      <MatchControls
        courtsAvailable={1}
        currentMatchIds={[]}
        match={match}
        onScoreEntryClose={onScoreEntryClose}
        onScoreEntryOpen={onScoreEntryOpen}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Enter scores" }));

    expect(onScoreEntryOpen).toHaveBeenCalledWith(match._id.toString());

    fireEvent.click(screen.getByRole("button", { name: "Close score modal" }));

    expect(onScoreEntryClose).toHaveBeenCalled();
  });

  it("notifies the parent when an open score entry unmounts", () => {
    const teams = makeTeams(2);
    const onScoreEntryClose = vi.fn();
    const { unmount } = render(
      <MatchControls
        courtsAvailable={1}
        currentMatchIds={[]}
        match={makeMatch({
          status: "in_progress",
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[1]._id, sets: [] },
        })}
        onScoreEntryClose={onScoreEntryClose}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Enter scores" }));
    unmount();

    expect(onScoreEntryClose).toHaveBeenCalled();
  });

  it("shows API conflicts as toast notifications", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          code: "CONFLICT",
          error: "No courts available",
        },
        409,
      ),
    );
    vi.stubGlobal("fetch", fetch);

    render(
      <ToastProvider>
        <MatchControls
          courtsAvailable={2}
          currentMatchIds={[]}
          match={makeMatch({ status: "ready" })}
          onUpdated={vi.fn()}
          teamAName="Alpha"
          teamBName="Beta"
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Mark as in progress" }),
    );

    expect(await screen.findByText("No courts available")).toBeInTheDocument();
  });

  it("uses the fallback error when an API error body cannot be parsed", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("not-json", { status: 500 }));
    vi.stubGlobal("fetch", fetch);

    render(
      <ToastProvider>
        <MatchControls
          courtsAvailable={1}
          currentMatchIds={[]}
          match={makeMatch({ status: "ready" })}
          onUpdated={vi.fn()}
          teamAName="Alpha"
          teamBName="Beta"
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Mark as in progress" }),
    );

    expect(await screen.findAllByText("Unable to update match")).not.toHaveLength(0);
  });

  it("shows a winner-only error toast when confirmation fails", async () => {
    const teams = makeTeams(2);
    const fetch = vi.fn().mockRejectedValue(new Error("Network down"));
    vi.stubGlobal("fetch", fetch);

    render(
      <ToastProvider>
        <MatchControls
          courtsAvailable={1}
          currentMatchIds={[]}
          match={makeMatch({
            status: "in_progress",
            teamA: { teamId: teams[0]._id, sets: [] },
            teamB: { teamId: teams[1]._id, sets: [] },
          })}
          matchResultMode="winner_only"
          onUpdated={vi.fn()}
          teamAName="Alpha"
          teamBName="Beta"
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Alpha won" }));

    expect(await screen.findAllByText("Unable to confirm match.")).not.toHaveLength(0);
  });
});
