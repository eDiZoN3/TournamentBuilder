// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TournamentThemePicker } from "@/components/admin/TournamentThemePicker";
import { ToastProvider } from "@/components/ui/Toast";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("TournamentThemePicker", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("normalizes unknown stored themes to the default theme", () => {
    render(
      <TournamentThemePicker
        currentTheme="legacy-theme"
        onUpdated={vi.fn()}
        tournamentId="tournament-id"
      />,
    );

    expect(screen.getByLabelText("Theme")).toHaveValue("default");
  });

  it("saves a changed theme and shows a success toast", async () => {
    const onUpdated = vi.fn();
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ theme: "knight" }));
    vi.stubGlobal("fetch", fetch);

    render(
      <ToastProvider>
        <TournamentThemePicker
          currentTheme="default"
          onUpdated={onUpdated}
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByLabelText("Theme"), {
      target: { value: "knight" },
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/tournaments/tournament-id",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ theme: "knight" }),
        }),
      );
      expect(onUpdated).toHaveBeenCalled();
    });
    expect(await screen.findByText("Theme updated")).toBeInTheDocument();
  });

  it("shows API error messages when saving fails", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          error: "Theme is locked",
        },
        409,
      ),
    );
    vi.stubGlobal("fetch", fetch);

    render(
      <ToastProvider>
        <TournamentThemePicker
          currentTheme="default"
          onUpdated={vi.fn()}
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByLabelText("Theme"), {
      target: { value: "gaming" },
    });

    expect(await screen.findByText("Theme is locked")).toBeInTheDocument();
  });

  it("falls back to a generic toast when the theme request rejects", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("Network down"));
    vi.stubGlobal("fetch", fetch);

    render(
      <ToastProvider>
        <TournamentThemePicker
          currentTheme="default"
          onUpdated={vi.fn()}
          tournamentId="tournament-id"
        />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByLabelText("Theme"), {
      target: { value: "volleyball" },
    });

    expect(await screen.findAllByText("Unable to change the theme.")).not.toHaveLength(0);
  });
});
