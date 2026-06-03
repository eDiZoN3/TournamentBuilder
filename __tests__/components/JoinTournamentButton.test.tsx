// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JoinTournamentButton } from "@/components/player/JoinTournamentButton";

describe("JoinTournamentButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("joins a tournament for the current player", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        player: {
          displayName: "Alice Example",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <JoinTournamentButton
        currentPlayerName="Alice Example"
        initiallyJoined={false}
        tournamentId="tournament-id"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Join tournament" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/tournaments/tournament-id/join", {
        method: "POST",
      });
      expect(screen.getByText("Joined as Alice Example")).toBeInTheDocument();
    });
  });

  it("links anonymous users to signup", () => {
    render(
      <JoinTournamentButton
        currentPlayerName={null}
        initiallyJoined={false}
        tournamentId="tournament-id"
      />,
    );

    expect(screen.getByRole("link", { name: "Sign up to join" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });
});
