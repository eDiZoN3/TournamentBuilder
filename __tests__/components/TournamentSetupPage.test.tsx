// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useParams, useRouter } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TournamentSetupForm } from "@/components/admin/TournamentSetupForm";
import TournamentSetupPage from "@/app/admin/tournament/[id]/setup/page";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

const mockedUseRouter = vi.mocked(useRouter);
const mockedUseParams = vi.mocked(useParams);
const push = vi.fn();
const refresh = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("TournamentSetupForm", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    mockedUseRouter.mockReturnValue({ push, refresh } as never);
    mockedUseParams.mockReturnValue({ id: "tournament-id" });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("validates that team mode has two non-empty teams", async () => {
    render(
      <TournamentSetupForm
        tournament={{
          _id: "tournament-id",
          name: "Summer Cup",
          teamSize: 2,
          inputMode: "teams",
          allowSelfJoin: false,
          joinedPlayers: [],
          teams: [],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start tournament" }));

    expect(
      await screen.findByText("Enter at least two team names."),
    ).toBeInTheDocument();
  });

  it("persists team names before requesting tournament start", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ tournamentId: "tournament-id" }));
    vi.stubGlobal("fetch", fetch);
    render(
      <TournamentSetupForm
        tournament={{
          _id: "tournament-id",
          name: "Summer Cup",
          teamSize: 2,
          inputMode: "teams",
          allowSelfJoin: false,
          joinedPlayers: [],
          teams: [],
        }}
      />,
    );

    const teamInputs = screen.getAllByLabelText(/Team \d+ name/);
    fireEvent.change(teamInputs[0], { target: { value: "Alpha" } });
    fireEvent.change(teamInputs[1], { target: { value: "Beta" } });
    fireEvent.click(screen.getByRole("button", { name: "Start tournament" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        "/api/tournaments/tournament-id",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            teams: [
              { name: "Alpha", players: [], seed: 0 },
              { name: "Beta", players: [], seed: 0 },
            ],
          }),
        }),
      );
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        "/api/tournaments/tournament-id/start",
        expect.objectContaining({ method: "POST" }),
      );
      expect(push).toHaveBeenCalledWith(
        "/admin/tournament/tournament-id/manage",
      );
    });
  });

  it("generates editable player-mode team previews and warns about remainders", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    render(
      <TournamentSetupForm
        tournament={{
          _id: "tournament-id",
          name: "Summer Cup",
          teamSize: 3,
          inputMode: "players",
          allowSelfJoin: false,
          joinedPlayers: [],
          teams: [],
        }}
      />,
    );

    for (let index = 0; index < 5; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Add player" }));
    }

    screen.getAllByLabelText(/Player \d+ name/).forEach((input, index) => {
      fireEvent.change(input, {
        target: {
          value: `Player ${index + 1}`,
        },
      });
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate teams" }));

    expect(screen.getByText("Some players will be added to the last team.")).toBeInTheDocument();
    expect(screen.getByLabelText("Preview team 1 name")).toHaveValue("Team A");
    expect(screen.getByLabelText("Preview team 2 name")).toHaveValue("Team B");
  });

  it("includes self-joined players in player-mode setup", () => {
    render(
      <TournamentSetupForm
        tournament={{
          _id: "tournament-id",
          name: "Open Cup",
          teamSize: 2,
          inputMode: "players",
          allowSelfJoin: true,
          joinedPlayers: [
            {
              userId: "user-a",
              playerProfileId: "profile-a",
              firstName: "Alice",
              displayName: "Alice Example",
              email: "alice@example.com",
              joinedAt: "2026-06-03T12:00:00.000Z",
            },
          ],
          teams: [],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Joined players" })).toBeInTheDocument();
    expect(screen.getByText("Alice Example")).toBeInTheDocument();
    expect(screen.getByLabelText("Player 1 name")).toHaveValue("Alice Example");
  });

  it("persists individual mixer players without generating fixed teams", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ tournamentId: "tournament-id" }));
    vi.stubGlobal("fetch", fetch);
    render(
      <TournamentSetupForm
        tournament={{
          _id: "tournament-id",
          name: "Mixer Cup",
          format: "individual_mixer",
          teamSize: 2,
          inputMode: "players",
          allowSelfJoin: false,
          joinedPlayers: [],
          teams: [],
        }}
      />,
    );

    for (let index = 0; index < 2; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Add player" }));
    }

    screen.getAllByLabelText(/Player \d+ name/).forEach((input, index) => {
      fireEvent.change(input, {
        target: {
          value: ["Alice", "Bob", "Charlie", "Dana"][index],
        },
      });
    });
    fireEvent.click(screen.getByRole("button", { name: "Start tournament" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        "/api/tournaments/tournament-id",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            teams: [
              { name: "Alice", players: ["Alice"], seed: 1 },
              { name: "Bob", players: ["Bob"], seed: 2 },
              { name: "Charlie", players: ["Charlie"], seed: 3 },
              { name: "Dana", players: ["Dana"], seed: 4 },
            ],
          }),
        }),
      );
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        "/api/tournaments/tournament-id/start",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(screen.queryByRole("button", { name: "Generate teams" })).not.toBeInTheDocument();
  });

  it("loads the tournament for the setup route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          _id: "tournament-id",
          name: "Loaded Cup",
          teamSize: 2,
          inputMode: "teams",
          teams: [],
        }),
      ),
    );

    render(<TournamentSetupPage />);

    expect(screen.getByText("Loading tournament...")).toBeInTheDocument();
    expect(await screen.findByText("Set up Loaded Cup")).toBeInTheDocument();
  });

  it("shows an API error when the setup route cannot load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: "Tournament not found",
          },
          404,
        ),
      ),
    );

    render(<TournamentSetupPage />);

    expect(await screen.findByText("Tournament not found")).toBeInTheDocument();
  });

  it("refreshes joined players while the setup route stays open", async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          _id: "tournament-id",
          name: "Open Cup",
          teamSize: 2,
          inputMode: "players",
          allowSelfJoin: true,
          joinedPlayers: [],
          teams: [],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          _id: "tournament-id",
          name: "Open Cup",
          teamSize: 2,
          inputMode: "players",
          allowSelfJoin: true,
          joinedPlayers: [
            {
              userId: "user-a",
              playerProfileId: "profile-a",
              firstName: "Alice",
              displayName: "Alice Example",
              email: "alice@example.com",
              joinedAt: "2026-06-03T12:00:00.000Z",
            },
          ],
          teams: [],
        }),
      );
    vi.stubGlobal("fetch", fetch);

    render(<TournamentSetupPage />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText("Set up Open Cup")).toBeInTheDocument();
    expect(screen.queryByText("Alice Example")).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(999);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Alice Example")).toBeInTheDocument();
  });
});
