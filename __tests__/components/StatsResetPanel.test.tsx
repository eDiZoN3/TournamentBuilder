// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TournamentSummary } from "@/components/admin/AdminDashboard";
import type { PlayerUserSummary } from "@/components/admin/PlayerUsersPanel";

const players: PlayerUserSummary[] = [
  {
    _id: "profile-id",
    userId: "user-id",
    createdAt: "2026-06-01T12:00:00.000Z",
    displayName: "Alice Example",
    email: "alice@example.com",
    firstName: "Alice",
    surname: "Example",
    mustChangePassword: false,
  },
];

const tournaments: TournamentSummary[] = [
  {
    _id: "tournament-id",
    name: "Summer Cup",
    status: "completed",
    createdAt: "2026-06-01T12:00:00.000Z",
    teamCount: 4,
    matchCount: 6,
  },
];

interface StatsResetPanelProps {
  currentUserRole: "admin" | "tournament_lead";
  players: PlayerUserSummary[];
  seasons: number[];
  tournaments: TournamentSummary[];
}

async function renderStatsResetPanel(
  props: Partial<StatsResetPanelProps> = {},
) {
  const modulePath = "@/components/admin/StatsResetPanel";
  const mod = (await import(modulePath)) as {
    StatsResetPanel: ComponentType<StatsResetPanelProps>;
  };
  const StatsResetPanel = mod.StatsResetPanel;

  render(
    <StatsResetPanel
      currentUserRole="admin"
      players={players}
      seasons={[2026, 2025]}
      tournaments={tournaments}
      {...props}
    />,
  );
}

function confirmReset() {
  fireEvent.change(screen.getByLabelText("Type RESET STATS to confirm"), {
    target: { value: "RESET STATS" },
  });
}

describe("StatsResetPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders reset scope controls and requires exact confirmation", async () => {
    await renderStatsResetPanel();

    expect(
      screen.getByRole("heading", { name: "Stats reset" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Reset scope")).toHaveValue("player");
    expect(screen.getByLabelText("Player")).toHaveValue("profile-id");
    expect(screen.getByRole("button", { name: "Reset stats" })).toBeDisabled();

    confirmReset();

    expect(screen.getByRole("button", { name: "Reset stats" })).toBeEnabled();
  });

  it("submits a player reset payload and shows success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reset: { scope: "player" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await renderStatsResetPanel();

    confirmReset();
    fireEvent.click(screen.getByRole("button", { name: "Reset stats" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/stats/reset", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scope: "player",
          playerProfileId: "profile-id",
          confirmation: "RESET STATS",
        }),
      });
    });
    expect(await screen.findByText("Stats reset complete.")).toBeInTheDocument();
  });

  it("submits tournament, season, and complete reset payloads", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reset: { scope: "all" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await renderStatsResetPanel();

    fireEvent.change(screen.getByLabelText("Reset scope"), {
      target: { value: "tournament" },
    });
    expect(screen.getByLabelText("Tournament")).toHaveValue("tournament-id");
    confirmReset();
    fireEvent.click(screen.getByRole("button", { name: "Reset stats" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/admin/stats/reset",
        expect.objectContaining({
          body: JSON.stringify({
            scope: "tournament",
            tournamentId: "tournament-id",
            confirmation: "RESET STATS",
          }),
        }),
      );
    });

    fireEvent.change(screen.getByLabelText("Reset scope"), {
      target: { value: "season" },
    });
    expect(screen.getByLabelText("Season")).toHaveValue("2026");
    confirmReset();
    fireEvent.click(screen.getByRole("button", { name: "Reset stats" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/admin/stats/reset",
        expect.objectContaining({
          body: JSON.stringify({
            scope: "season",
            season: 2026,
            confirmation: "RESET STATS",
          }),
        }),
      );
    });

    fireEvent.change(screen.getByLabelText("Reset scope"), {
      target: { value: "all" },
    });
    confirmReset();
    fireEvent.click(screen.getByRole("button", { name: "Reset stats" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/admin/stats/reset",
        expect.objectContaining({
          body: JSON.stringify({
            scope: "all",
            confirmation: "RESET STATS",
          }),
        }),
      );
    });
  });

  it("shows API errors inline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Unable to reset stats." }),
      }),
    );
    await renderStatsResetPanel();

    confirmReset();
    fireEvent.click(screen.getByRole("button", { name: "Reset stats" }));

    expect(await screen.findByText("Unable to reset stats.")).toBeInTheDocument();
  });

  it("shows a read-only explanation for tournament leads", async () => {
    await renderStatsResetPanel({
      currentUserRole: "tournament_lead",
    });

    expect(
      screen.getByText("Only admins can reset stats."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reset stats" }),
    ).not.toBeInTheDocument();
  });
});
