// @vitest-environment jsdom

import { act, render, screen, within } from "@testing-library/react";
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
