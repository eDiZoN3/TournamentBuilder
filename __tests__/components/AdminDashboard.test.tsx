// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDashboard, type TournamentSummary } from "@/components/admin/AdminDashboard";

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
];

describe("AdminDashboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows status-specific actions and the create link", () => {
    render(<AdminDashboard initialTournaments={tournaments} />);

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
    expect(screen.queryByRole("button", { name: "Delete Active Cup" })).not.toBeInTheDocument();
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

  it("shows an empty state", () => {
    render(<AdminDashboard initialTournaments={[]} />);

    expect(screen.getByText("No tournaments yet.")).toBeInTheDocument();
  });
});
