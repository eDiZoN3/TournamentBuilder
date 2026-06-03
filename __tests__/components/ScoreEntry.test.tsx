// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeSet, makeTeams } from "@/__tests__/helpers/factories";
import { ScoreEntry } from "@/components/admin/ScoreEntry";
import { ToastProvider } from "@/components/ui/Toast";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function liveMatch(overrides: Parameters<typeof makeMatch>[0] = {}) {
  const teams = makeTeams(2);

  return makeMatch({
    status: "in_progress",
    teamA: { teamId: teams[0]._id, sets: [] },
    teamB: { teamId: teams[1]._id, sets: [] },
    ...overrides,
  });
}

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

function enterSet(setNumber: number, scoreA: string, scoreB: string) {
  fireEvent.change(screen.getByLabelText(`Set ${setNumber} Team A`), {
    target: { value: scoreA },
  });
  fireEvent.change(screen.getByLabelText(`Set ${setNumber} Team B`), {
    target: { value: scoreB },
  });
}

describe("ScoreEntry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows BO1 confirmation after saving a valid score", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        sets: [makeSet(11, 9)],
        matchWinner: "A",
        clearedSets: 0,
      }),
    );
    vi.stubGlobal("fetch", fetch);

    render(
      <ScoreEntry
        match={liveMatch()}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    enterSet(1, "11", "9");
    fireEvent.click(screen.getByRole("button", { name: "Save set 1" }));

    expect(
      await screen.findByRole("button", { name: "Confirm match" }),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/scores$/),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ setIndex: 0, scoreA: 11, scoreB: 9 }),
      }),
    );
  });

  it("shows an inline validation error without calling the API", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    render(
      <ScoreEntry
        match={liveMatch()}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    enterSet(1, "11", "10");
    fireEvent.click(screen.getByRole("button", { name: "Save set 1" }));

    expect(
      screen.getByText("Winner must lead by at least 2 points"),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Confirm match" }),
    ).not.toBeInTheDocument();
  });

  it("unlocks BO3 set two only after set one is saved", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          sets: [makeSet(11, 9)],
          matchWinner: null,
          clearedSets: 0,
        }),
      ),
    );

    render(
      <ScoreEntry
        match={liveMatch({ format: "bo3" })}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    expect(screen.getByLabelText("Set 2 Team A")).toBeDisabled();
    expect(screen.getByLabelText("Set 3 Team A")).toBeDisabled();

    enterSet(1, "11", "9");
    fireEvent.click(screen.getByRole("button", { name: "Save set 1" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Set 2 Team A")).toBeEnabled();
    });
    expect(screen.getByLabelText("Set 3 Team A")).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Confirm match" }),
    ).not.toBeInTheDocument();
  });

  it("clears later BO3 drafts when an earlier set is re-entered", async () => {
    const teams = makeTeams(2);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          sets: [makeSet(9, 11)],
          matchWinner: null,
          clearedSets: 1,
        }),
      ),
    );

    render(
      <ScoreEntry
        match={liveMatch({
          format: "bo3",
          teamA: {
            teamId: teams[0]._id,
            sets: [makeSet(11, 9), makeSet(11, 8)],
          },
          teamB: { teamId: teams[1]._id, sets: [] },
        })}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    expect(screen.getByLabelText("Set 2 Team A")).toHaveValue(11);

    enterSet(1, "9", "11");
    fireEvent.click(screen.getByRole("button", { name: "Save set 1" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Set 2 Team A")).toHaveValue(null);
    });
  });

  it("confirms a won match through the status endpoint", async () => {
    const teams = makeTeams(2);
    const onClose = vi.fn();
    const onUpdated = vi.fn();
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        status: "completed",
      }),
    );
    vi.stubGlobal("fetch", fetch);

    render(
      <ScoreEntry
        match={liveMatch({
          teamA: { teamId: teams[0]._id, sets: [makeSet(11, 9)] },
          teamB: { teamId: teams[1]._id, sets: [] },
        })}
        onClose={onClose}
        onUpdated={onUpdated}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm match" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/status$/),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ status: "completed" }),
        }),
      );
      expect(onUpdated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows score API failures as toast notifications", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            code: "CONFLICT",
            error: "Match is already completed",
          },
          409,
        ),
      ),
    );

    render(
      <ToastProvider>
        <ScoreEntry
          match={liveMatch()}
          onClose={vi.fn()}
          onUpdated={vi.fn()}
          teamAName="Alpha"
          teamBName="Beta"
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    enterSet(1, "11", "9");
    fireEvent.click(screen.getByRole("button", { name: "Save set 1" }));

    expect(await screen.findByText("Match is already completed")).toBeInTheDocument();
  });

  it("validates override scores inline without calling the API", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    render(
      <ScoreEntry
        match={completedMatch()}
        mode="override"
        onClose={vi.fn()}
        onUpdated={vi.fn()}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    enterSet(1, "11", "10");
    fireEvent.click(screen.getByRole("button", { name: "Save set 1" }));

    expect(
      screen.getByText("Winner must lead by at least 2 points"),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation before submitting a winner-changing override", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        matchId: "match-id",
        winnerChanged: true,
        affectedMatchIds: ["downstream-id"],
        tournamentStatus: "active",
      }),
    );
    const onClose = vi.fn();
    const onUpdated = vi.fn();
    vi.stubGlobal("fetch", fetch);

    render(
      <ScoreEntry
        match={completedMatch()}
        mode="override"
        onClose={onClose}
        onUpdated={onUpdated}
        teamAName="Alpha"
        teamBName="Beta"
        tournamentId="tournament-id"
      />,
    );

    enterSet(1, "9", "11");
    fireEvent.click(screen.getByRole("button", { name: "Save set 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit override" }));

    expect(
      screen.getByText("Changing the winner will reset downstream matches."),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirm override" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/override$/),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            sets: [{ scoreA: 9, scoreB: 11, pointsToWin: 11 }],
          }),
        }),
      );
      expect(onUpdated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("submits same-winner overrides without an extra warning", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        matchId: "match-id",
        winnerChanged: false,
        affectedMatchIds: [],
        tournamentStatus: "completed",
      }),
    );
    vi.stubGlobal("fetch", fetch);

    render(
      <ToastProvider>
        <ScoreEntry
          match={completedMatch()}
          mode="override"
          onClose={vi.fn()}
          onUpdated={vi.fn()}
          teamAName="Alpha"
          teamBName="Beta"
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit override" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/override$/),
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
    expect(
      screen.queryByText("Changing the winner will reset downstream matches."),
    ).not.toBeInTheDocument();
  });
});
