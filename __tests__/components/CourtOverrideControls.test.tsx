// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeMatch } from "@/__tests__/helpers/factories";
import { CourtOverrideControls } from "@/components/admin/CourtOverrideControls";
import { ToastProvider } from "@/components/ui/Toast";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("CourtOverrideControls", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("assigns a selected court and refreshes the tournament", async () => {
    const onUpdated = vi.fn();
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        matchId: "match-id",
        status: "in_progress",
        courtNumber: 2,
        replacedMatchId: null,
      }),
    );
    vi.stubGlobal("fetch", fetch);

    render(
      <ToastProvider>
        <CourtOverrideControls
          courtsAvailable={2}
          match={makeMatch({ status: "ready" })}
          onUpdated={onUpdated}
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByLabelText("Court override"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Assign court" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/court$/),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ courtNumber: 2 }),
        }),
      );
      expect(onUpdated).toHaveBeenCalled();
    });
    expect(screen.getByText("Court 2 assigned.")).toBeInTheDocument();
  });

  it("shows when an occupied court was replaced", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          matchId: "match-id",
          status: "in_progress",
          courtNumber: 1,
          replacedMatchId: "old-match-id",
        }),
      ),
    );

    render(
      <ToastProvider>
        <CourtOverrideControls
          courtsAvailable={2}
          match={makeMatch({ status: "ready" })}
          onUpdated={vi.fn()}
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Assign court" }));

    expect(
      await screen.findByText("Court 1 assigned; previous match returned to ready."),
    ).toBeInTheDocument();
  });

  it("is hidden when there is only one court", () => {
    render(
      <ToastProvider>
        <CourtOverrideControls
          courtsAvailable={1}
          match={makeMatch({ status: "ready" })}
          onUpdated={vi.fn()}
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    expect(screen.queryByTestId("court-override")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Assign court" }),
    ).not.toBeInTheDocument();
  });
});
