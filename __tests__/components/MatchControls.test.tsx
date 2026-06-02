// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeTeams } from "@/__tests__/helpers/factories";
import { MatchControls } from "@/components/admin/MatchControls";
import { ToastProvider } from "@/components/ui/Toast";

vi.mock("@/components/admin/ScoreEntry", () => ({
  ScoreEntry: () => <div data-testid="score-entry">Score modal</div>,
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
        courtsAvailable={1}
        currentMatchIds={[makeMatch()._id]}
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
});
