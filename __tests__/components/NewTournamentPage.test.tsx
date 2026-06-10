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
          format: "double_elimination",
          knockoutBracketType: "double_elimination",
          firstRoundPairingMode: "random",
          matchResultMode: "points",
          knockoutMatchFormat: "bo3_semis_finals",
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
            format: "double_elimination",
            knockoutBracketType: "double_elimination",
            firstRoundPairingMode: "random",
            matchResultMode: "points",
            knockoutMatchFormat: "bo3_semis_finals",
            teamSize: 2,
            courtsAvailable: 1,
            inputMode: "players",
            allowSelfJoin: true,
          }),
        }),
      );
    });
  });

  it("sends the team round-robin format with team entry", async () => {
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
      target: { value: "League Cup" },
    });
    fireEvent.click(screen.getByLabelText("Team round robin"));
    fireEvent.click(screen.getByRole("button", { name: "Create tournament" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/tournaments",
        expect.objectContaining({
          body: JSON.stringify({
            name: "League Cup",
            format: "team_round_robin",
            teamSize: 2,
            courtsAvailable: 1,
            inputMode: "teams",
            allowSelfJoin: false,
            roundRobinMatchFormat: "bo1",
          }),
        }),
      );
    });
  });

  it("submits single-elimination manual winner-only knockout settings", async () => {
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
      target: { value: "Manual KO Cup" },
    });
    fireEvent.click(screen.getByLabelText("Single elimination"));
    fireEvent.click(screen.getByLabelText("Manual first-round pairing"));
    fireEvent.click(screen.getByLabelText("Winner only"));
    expect(screen.queryByLabelText("Best-of-three semi-finals and final")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create tournament" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/tournaments",
        expect.objectContaining({
          body: JSON.stringify({
            name: "Manual KO Cup",
            format: "double_elimination",
            knockoutBracketType: "single_elimination",
            firstRoundPairingMode: "manual",
            matchResultMode: "winner_only",
            knockoutMatchFormat: "bo1",
            teamSize: 2,
            courtsAvailable: 1,
            inputMode: "teams",
            allowSelfJoin: false,
          }),
        }),
      );
    });
  });

  it("submits BO1 knockout matches when the BO3 finals switch is disabled", async () => {
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
      target: { value: "BO1 Cup" },
    });
    fireEvent.click(screen.getByLabelText("Best-of-three semi-finals and final"));
    fireEvent.click(screen.getByRole("button", { name: "Create tournament" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/tournaments",
        expect.objectContaining({
          body: JSON.stringify({
            name: "BO1 Cup",
            format: "double_elimination",
            knockoutBracketType: "double_elimination",
            firstRoundPairingMode: "random",
            matchResultMode: "points",
            knockoutMatchFormat: "bo1",
            teamSize: 2,
            courtsAvailable: 1,
            inputMode: "teams",
            allowSelfJoin: false,
          }),
        }),
      );
    });
  });

  it("allows team round-robin tournaments to use player entry and self-join", async () => {
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
      target: { value: "Open League" },
    });
    fireEvent.click(screen.getByLabelText("Team round robin"));
    fireEvent.click(screen.getByLabelText("Enter player names"));
    fireEvent.click(screen.getByLabelText("Allow player account self-join"));
    fireEvent.click(screen.getByRole("button", { name: "Create tournament" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/tournaments",
        expect.objectContaining({
          body: JSON.stringify({
            name: "Open League",
            format: "team_round_robin",
            teamSize: 2,
            courtsAvailable: 1,
            inputMode: "players",
            allowSelfJoin: true,
            roundRobinMatchFormat: "bo1",
          }),
        }),
      );
    });
  });

  it("submits best-of-three for team round-robin tournaments", async () => {
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
      target: { value: "Best Of League" },
    });
    fireEvent.click(screen.getByLabelText("Team round robin"));
    fireEvent.click(screen.getByLabelText("Best of three"));
    fireEvent.click(screen.getByRole("button", { name: "Create tournament" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/tournaments",
        expect.objectContaining({
          body: JSON.stringify({
            name: "Best Of League",
            format: "team_round_robin",
            teamSize: 2,
            courtsAvailable: 1,
            inputMode: "teams",
            allowSelfJoin: false,
            roundRobinMatchFormat: "bo3",
          }),
        }),
      );
    });
  });

  it("sends the individual mixer format with player entry", async () => {
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
      target: { value: "Mixer Cup" },
    });
    fireEvent.click(screen.getByLabelText("Individual mixer"));
    fireEvent.click(screen.getByRole("button", { name: "Create tournament" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/tournaments",
        expect.objectContaining({
          body: JSON.stringify({
            name: "Mixer Cup",
            format: "individual_mixer",
            teamSize: 2,
            courtsAvailable: 1,
            inputMode: "players",
            allowSelfJoin: false,
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

