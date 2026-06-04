// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { signOut } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerAccountView } from "@/components/player/PlayerAccountView";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

const mockedSignOut = vi.mocked(signOut);

describe("PlayerAccountView", () => {
  beforeEach(() => {
    mockedSignOut.mockReset();
  });

  it("shows profile data and the player stats summary", () => {
    render(
      <PlayerAccountView
        profile={{
          _id: "profile-id",
          displayName: "Alice Example",
          email: "alice@example.com",
          firstName: "Alice",
          surname: "Example",
          userId: "user-id",
        }}
        stats={{
          matchesPlayed: 4,
          matchesWon: 3,
          pointsFor: 88,
          winRate: 0.75,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Alice Example" })).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("shows an empty state for players without completed matches", () => {
    render(
      <PlayerAccountView
        profile={{
          _id: "profile-id",
          displayName: "Alice Example",
          email: "alice@example.com",
          firstName: "Alice",
          userId: "user-id",
        }}
        stats={null}
      />,
    );

    expect(screen.getByText("No completed matches yet.")).toBeInTheDocument();
  });

  it("shows a player logout button that redirects to the shared login page", () => {
    render(
      <PlayerAccountView
        profile={{
          _id: "profile-id",
          displayName: "Alice Example",
          email: "alice@example.com",
          firstName: "Alice",
          userId: "user-id",
        }}
        stats={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(mockedSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});
