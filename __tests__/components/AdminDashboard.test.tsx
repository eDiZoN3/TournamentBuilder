// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDashboard, type TournamentSummary } from "@/components/admin/AdminDashboard";
import type { PlayerUserSummary } from "@/components/admin/PlayerUsersPanel";
import { ToastProvider } from "@/components/ui/Toast";

const tournaments: TournamentSummary[] = [
  {
    _id: "draft-id",
    name: "Draft Cup",
    status: "draft",
    createdAt: "2026-06-01T12:00:00.000Z",
    teamCount: 4,
    matchCount: 0,
  },
  {
    _id: "active-id",
    name: "Active Cup",
    status: "active",
    createdAt: "2026-06-02T12:00:00.000Z",
    teamCount: 8,
    matchCount: 14,
  },
  {
    _id: "completed-id",
    name: "Completed Cup",
    status: "completed",
    createdAt: "2026-06-03T12:00:00.000Z",
    teamCount: 8,
    matchCount: 14,
  },
];
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
const metrics = {
  playedMatches: 12,
  registeredAdmins: 1,
  registeredPlayers: 1,
  registeredTournaments: 3,
  tournamentsByStatus: {
    active: 1,
    completed: 1,
    draft: 1,
  },
};

describe("AdminDashboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows status-specific actions and the create link", () => {
    render(
      <AdminDashboard
        initialAdmins={[
          {
            _id: "owner-id",
            email: "owner@example.com",
            mustChangePassword: false,
            createdAt: "2026-06-01T12:00:00.000Z",
          },
        ]}
        initialMetrics={metrics}
        initialPlayers={players}
        initialTournaments={tournaments}
      />,
    );

    expect(screen.getByRole("link", { name: "Create New Tournament" })).toHaveAttribute(
      "href",
      "/admin/tournament/new",
    );
    expect(screen.getByRole("link", { name: "Setup Draft Cup" })).toHaveAttribute(
      "href",
      "/admin/tournament/draft-id/setup",
    );
    expect(screen.getByRole("link", { name: "Manage Active Cup" })).toHaveAttribute(
      "href",
      "/admin/tournament/active-id/manage",
    );
    expect(screen.getByRole("link", { name: "View Active Cup" })).toHaveAttribute(
      "href",
      "/tournament/active-id",
    );
    expect(screen.getByRole("button", { name: "Delete Active Cup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Completed Cup" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Admin accounts" })).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByText("Registered players")).toBeInTheDocument();
    expect(screen.getByText("Played matches")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Player accounts" })).toBeInTheDocument();
    expect(screen.getByText("Alice Example")).toBeInTheDocument();
  });

  it("requires a second click before deleting a draft", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminDashboard initialTournaments={tournaments} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Draft Cup" }));

    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirm Delete Draft Cup" }));

    await waitFor(() => {
      expect(screen.queryByText("Draft Cup")).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/tournaments/draft-id", {
      method: "DELETE",
    });
  });

  it("requires the exact tournament name before deleting an active tournament", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminDashboard initialTournaments={tournaments} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Active Cup" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText("Type Active Cup to confirm deletion."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm Delete Active Cup" }),
    ).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Type Active Cup to confirm deletion"), {
      target: { value: "Active Cup" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm Delete Active Cup" }));

    await waitFor(() => {
      expect(screen.queryByText("Active Cup")).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/tournaments/active-id", {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        confirmationName: "Active Cup",
      }),
    });
  });

  it("shows an empty state", () => {
    render(<AdminDashboard initialTournaments={[]} />);

    expect(
      screen.getByRole("heading", { name: "No tournaments yet." }),
    ).toBeInTheDocument();
  });

  it("shows delete failures as toast notifications", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ToastProvider>
        <AdminDashboard initialTournaments={tournaments} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Draft Cup" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Delete Draft Cup" }));

    expect(await screen.findByText("Unable to delete tournament.")).toBeInTheDocument();
  });
});
