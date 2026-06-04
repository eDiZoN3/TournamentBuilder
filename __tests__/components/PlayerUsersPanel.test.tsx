// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PlayerUsersPanel,
  type PlayerUserSummary,
} from "@/components/admin/PlayerUsersPanel";

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

describe("PlayerUsersPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lists existing players and creates a new player account", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        player: {
          _id: "new-profile-id",
          userId: "new-user-id",
          createdAt: "2026-06-03T12:00:00.000Z",
          displayName: "Bob Builder",
          email: "bob@example.com",
          firstName: "Bob",
          surname: "Builder",
          mustChangePassword: true,
        },
        temporaryPassword: "BcDeFg2345",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PlayerUsersPanel initialPlayers={players} />);

    expect(screen.getByText("Alice Example")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Player first name"), {
      target: { value: "Bob" },
    });
    fireEvent.change(screen.getByLabelText("Player surname"), {
      target: { value: "Builder" },
    });
    fireEvent.change(screen.getByLabelText("Player email"), {
      target: { value: "bob@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create player" }));

    expect(await screen.findByText("Temporary password")).toBeInTheDocument();
    expect(screen.getByText("BcDeFg2345")).toBeInTheDocument();
    expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/players", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "bob@example.com",
        firstName: "Bob",
        surname: "Builder",
      }),
    });
  });

  it("resets a player password and shows the temporary password once", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        player: {
          ...players[0],
          mustChangePassword: true,
        },
        temporaryPassword: "CdEfGh3456",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PlayerUsersPanel initialPlayers={players} />);

    fireEvent.click(screen.getByRole("button", { name: "Reset Alice Example password" }));

    expect(await screen.findByText("CdEfGh3456")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/players/profile-id/reset-password",
      {
        method: "POST",
      },
    );

    fireEvent.click(screen.getByRole("button", { name: "Dismiss temporary password" }));

    await waitFor(() => {
      expect(screen.queryByText("CdEfGh3456")).not.toBeInTheDocument();
    });
  });

  it("shows create failures inline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Email already registered" }),
      }),
    );

    render(<PlayerUsersPanel initialPlayers={players} />);

    fireEvent.change(screen.getByLabelText("Player first name"), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByLabelText("Player email"), {
      target: { value: "alice@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create player" }));

    expect(await screen.findByText("Email already registered")).toBeInTheDocument();
  });

  it("uses responsive container classes for the create-player card", () => {
    render(<PlayerUsersPanel initialPlayers={players} />);

    expect(screen.getByRole("region", { name: "Player accounts" })).toHaveClass(
      "w-full",
      "max-w-full",
    );
  });

  it("wraps long player names and emails in the account table", () => {
    render(
      <PlayerUsersPanel
        initialPlayers={[
          {
            ...players[0],
            displayName:
              "Alexandria Example With A Very Long Display Name For Mobile",
            email:
              "alexandria.example.with.a.very.long.email.address@example-volleyball.test",
          },
        ]}
      />,
    );

    expect(
      screen.getByText(
        "Alexandria Example With A Very Long Display Name For Mobile",
      ),
    ).toHaveClass("break-words");
    expect(
      screen.getByText(
        "alexandria.example.with.a.very.long.email.address@example-volleyball.test",
      ),
    ).toHaveClass("break-all");
  });
});
