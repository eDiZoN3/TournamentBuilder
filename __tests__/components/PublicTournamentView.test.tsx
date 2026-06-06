// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  makeMatch,
  makeTeams,
  makeTournament,
} from "@/__tests__/helpers/factories";
import type { ITournament } from "@/lib/models/Tournament";

const { useSWR } = vi.hoisted(() => ({
  useSWR: vi.fn(),
}));

vi.mock("swr", () => ({
  default: useSWR,
}));

import { PublicTournamentView } from "@/components/bracket/PublicTournamentView";

function tournament(
  overrides: Partial<ITournament> = {},
): ITournament {
  return {
    ...makeTournament(),
    updatedAt: new Date(),
    ...overrides,
  } as ITournament;
}

describe("PublicTournamentView", () => {
  beforeEach(() => {
    useSWR.mockReset();
    useSWR.mockImplementation(
      (_key: string, _fetcher: unknown, options: { fallbackData: ITournament }) => ({
        data: options.fallbackData,
      }),
    );
  });

  it("renders initial bracket data and polls active tournaments every five seconds", () => {
    const teams = makeTeams(2);
    teams[0].players = ["Alice"];
    teams[1].players = ["Bob"];
    const initialTournament = tournament({
      _id: teams[0]._id,
      name: "Summer Cup",
      status: "active",
      teams,
      matches: [
        makeMatch({
          status: "ready",
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[1]._id, sets: [] },
        }),
      ],
    });

    render(<PublicTournamentView initialTournament={initialTournament} />);

    const [, , options] = useSWR.mock.calls[0];

    expect(useSWR).toHaveBeenCalledWith(
      `/api/tournaments/${initialTournament._id.toString()}`,
      expect.any(Function),
      expect.any(Object),
    );
    expect(options.refreshInterval(initialTournament)).toBe(5000);
    expect(screen.getByRole("heading", { name: "Summer Cup" })).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Up next")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stats" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Team stats" })).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows self-join controls during draft join phase", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        player: {
          displayName: "Alice Example",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const initialTournament = tournament({
      _id: makeTeams(1)[0]._id,
      allowSelfJoin: true,
      inputMode: "players",
      joinedPlayers: [],
      name: "Open Cup",
      status: "draft",
    });

    render(
      <PublicTournamentView
        currentPlayerName="Alice Example"
        initialTournament={initialTournament}
      />,
    );

    expect(screen.getByRole("heading", { name: "Join phase" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Join tournament" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/tournaments/${initialTournament._id.toString()}/join`,
        { method: "POST" },
      );
      expect(screen.getByText("Joined as Alice Example")).toBeInTheDocument();
    });
  });

  it("highlights the current player's team in the bracket", () => {
    const teams = makeTeams(2);
    teams[0].players = ["Alice Example"];
    teams[1].players = ["Bob"];
    const initialTournament = tournament({
      name: "Player Cup",
      status: "active",
      teams,
      matches: [
        makeMatch({
          status: "ready",
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[1]._id, sets: [] },
        }),
      ],
    });

    render(
      <PublicTournamentView
        currentPlayerName="Alice Example"
        initialTournament={initialTournament}
      />,
    );

    expect(screen.getByTestId("team-a-row")).toHaveAttribute(
      "data-current-player-team",
      "true",
    );
    expect(screen.getByTestId("team-b-row")).toHaveAttribute(
      "data-current-player-team",
      "false",
    );
  });

  it("renders round-robin schedules and live standings instead of a bracket", () => {
    const teams = makeTeams(3);
    const initialTournament = tournament({
      format: "team_round_robin",
      name: "League Cup",
      status: "active",
      teams,
      matches: [
        makeMatch({
          label: "Round 1",
          status: "completed",
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
          teamA: {
            teamId: teams[0]._id,
            sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 }],
          },
          teamB: { teamId: teams[1]._id, sets: [] },
        }),
        makeMatch({
          label: "Round 2",
          round: 2,
          status: "ready",
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[2]._id, sets: [] },
        }),
      ],
    });

    render(<PublicTournamentView initialTournament={initialTournament} />);

    const roundRobinView = screen.getByTestId("round-robin-view");

    expect(roundRobinView).toBeInTheDocument();
    expect(within(roundRobinView).getByRole("heading", { name: "Standings" })).toBeInTheDocument();
    expect(within(roundRobinView).getByRole("heading", { name: "Schedule" })).toBeInTheDocument();
    expect(within(roundRobinView).getByText("Round 1")).toBeInTheDocument();
    expect(within(roundRobinView).getAllByText("Team A").length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: "Winner bracket" })).not.toBeInTheDocument();
  });

  it("keeps round-robin table columns fixed and highlights the active round", () => {
    const teams = makeTeams(3);
    const initialTournament = tournament({
      format: "team_round_robin",
      name: "League Cup",
      status: "active",
      teams,
      matches: [
        makeMatch({
          label: "Round 1",
          round: 1,
          status: "completed",
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
          teamA: {
            teamId: teams[0]._id,
            sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 }],
          },
          teamB: { teamId: teams[1]._id, sets: [] },
        }),
        makeMatch({
          label: "Round 2",
          round: 2,
          status: "in_progress",
          courtNumber: 1,
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[2]._id, sets: [] },
        }),
      ],
    });

    render(<PublicTournamentView initialTournament={initialTournament} />);

    const tables = screen.getAllByTestId("round-robin-table");
    const activeRound = screen.getByTestId("round-robin-round-2");
    const activeRow = within(activeRound).getByTestId("round-robin-match-row");

    expect(tables).toHaveLength(2);
    for (const table of tables) {
      expect(table).toHaveClass("table-fixed");
      expect(table).toHaveClass("min-w-[42rem]");
    }
    expect(activeRound).toHaveAttribute("data-active-round", "true");
    expect(screen.getByTestId("round-robin-round-1")).toHaveAttribute(
      "data-active-round",
      "false",
    );
    expect(activeRow).toHaveClass("bg-emerald-50");
  });

  it("highlights the current player in individual mixer standings", () => {
    const teams = makeTeams(2);
    teams[0].name = "Round 1 Team A";
    teams[0].players = ["Alice Example", "Bob"];
    teams[1].name = "Round 1 Team B";
    teams[1].players = ["Charlie", "Dana"];
    const initialTournament = tournament({
      format: "individual_mixer",
      inputMode: "players",
      name: "Mixer Cup",
      status: "active",
      teams,
      matches: [
        makeMatch({
          label: "Round 1",
          status: "completed",
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
          teamA: {
            teamId: teams[0]._id,
            sets: [{ scoreA: 11, scoreB: 7, pointsToWin: 11 }],
          },
          teamB: { teamId: teams[1]._id, sets: [] },
        }),
      ],
    });

    render(
      <PublicTournamentView
        currentPlayerName="Alice Example"
        initialTournament={initialTournament}
      />,
    );

    expect(
      within(screen.getByTestId("round-robin-view")).getByRole("row", {
        name: /Alice Example/,
      }),
    ).toHaveAttribute(
      "data-current-player",
      "true",
    );
  });

  it("stops polling and shows final standings when the tournament is complete", () => {
    const teams = makeTeams(4);
    const initialTournament = tournament({
      name: "Finished Cup",
      status: "completed",
      teams,
      matches: [
        makeMatch({
          round: 2,
          label: "WB Final",
          status: "completed",
          isWBFinal: true,
          winnerId: teams[0]._id,
          loserId: teams[1]._id,
          teamA: { teamId: teams[0]._id, sets: [] },
          teamB: { teamId: teams[1]._id, sets: [] },
        }),
        makeMatch({
          bracket: "loser",
          label: "LB Final",
          status: "completed",
          isLBFinal: true,
          winnerId: teams[2]._id,
          loserId: teams[3]._id,
          teamA: { teamId: teams[2]._id, sets: [] },
          teamB: { teamId: teams[3]._id, sets: [] },
        }),
      ],
    });

    render(<PublicTournamentView initialTournament={initialTournament} />);

    const [, , options] = useSWR.mock.calls[0];
    const overlay = screen.getByTestId("tournament-complete");

    expect(options.refreshInterval(initialTournament)).toBe(0);
    expect(
      within(overlay).getByRole("heading", { name: "Tournament complete" }),
    ).toBeInTheDocument();
    expect(within(overlay).getByText("1st")).toBeInTheDocument();
    expect(within(overlay).getByText("Team A")).toBeInTheDocument();
    expect(within(overlay).getByText("4th")).toBeInTheDocument();
    expect(within(overlay).getByText("Team D")).toBeInTheDocument();
  });

  it("shows a non-blocking banner after three refresh failures and clears it on success", () => {
    const initialTournament = tournament({ status: "active" });

    render(<PublicTournamentView initialTournament={initialTournament} />);

    const [, , options] = useSWR.mock.calls[0];

    act(() => {
      options.onError();
      options.onError();
      options.onError();
    });

    expect(screen.getByText("Unable to refresh")).toBeInTheDocument();

    act(() => {
      options.onSuccess();
    });

    expect(screen.queryByText("Unable to refresh")).not.toBeInTheDocument();
  });

  it("shows bracket skeletons during an initial SWR load with no data", () => {
    const initialTournament = tournament({
      name: "Loading Cup",
      status: "active",
    });
    useSWR.mockImplementationOnce(() => ({
      data: undefined,
      isLoading: true,
    }));

    render(<PublicTournamentView initialTournament={initialTournament} />);

    expect(screen.getByText("Loading bracket")).toBeInTheDocument();
    expect(screen.getAllByTestId("match-card-skeleton")).toHaveLength(4);
    expect(screen.queryByText("Up next")).not.toBeInTheDocument();
  });
});
