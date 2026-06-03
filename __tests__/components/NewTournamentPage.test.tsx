// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NewTournamentPage from "@/app/admin/tournament/new/page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const mockedUseRouter = vi.mocked(useRouter);
const push = vi.fn();
const refresh = vi.fn();

describe("NewTournamentPage", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    mockedUseRouter.mockReturnValue({ push, refresh } as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a tournament and redirects to setup", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          _id: "tournament-id",
        }),
        {
          status: 201,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<NewTournamentPage />);

    fireEvent.change(screen.getByLabelText("Tournament name"), {
      target: { value: "Summer Cup" },
    });
    fireEvent.click(screen.getByLabelText("3 players"));
    fireEvent.change(screen.getByLabelText("Courts available"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByLabelText("Enter player names"));
    fireEvent.click(screen.getByRole("button", { name: "Create tournament" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/tournaments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Summer Cup",
          teamSize: 3,
          courtsAvailable: 2,
          inputMode: "players",
          allowSelfJoin: false,
        }),
      });
      expect(push).toHaveBeenCalledWith("/admin/tournament/tournament-id/setup");
    });
  });

  it("sends self-join settings for player tournaments", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ _id: "tournament-id" }), {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetch);
    render(<NewTournamentPage />);

    fireEvent.change(screen.getByLabelText("Tournament name"), {
      target: { value: "Open Cup" },
    });
    fireEvent.click(screen.getByLabelText("Enter player names"));
    fireEvent.click(screen.getByLabelText("Allow player account self-join"));
    fireEvent.click(screen.getByRole("button", { name: "Create tournament" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/tournaments",
        expect.objectContaining({
          body: JSON.stringify({
            name: "Open Cup",
            teamSize: 2,
            courtsAvailable: 1,
            inputMode: "players",
            allowSelfJoin: true,
          }),
        }),
      );
    });
  });

  it("shows an inline API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "Invalid tournament details",
          }),
          {
            status: 422,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      ),
    );
    render(<NewTournamentPage />);

    fireEvent.change(screen.getByLabelText("Tournament name"), {
      target: { value: "Summer Cup" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create tournament" }));

    expect(
      await screen.findByText("Invalid tournament details"),
    ).toBeInTheDocument();
  });
});

