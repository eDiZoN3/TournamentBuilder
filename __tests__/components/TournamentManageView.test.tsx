// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeTeams, makeTournament } from "@/__tests__/helpers/factories";
import type { ITournament } from "@/lib/models/Tournament";

const { useSWR } = vi.hoisted(() => ({
  useSWR: vi.fn(),
}));

vi.mock("swr", () => ({
  default: useSWR,
}));

import { TournamentManageView } from "@/components/admin/TournamentManageView";

describe("TournamentManageView", () => {
  beforeEach(() => {
    useSWR.mockReset();
    useSWR.mockImplementation(
      (_key: string, _fetcher: unknown, options: { fallbackData: ITournament }) => ({
        data: options.fallbackData,
        mutate: vi.fn(),
      }),
    );
  });

  it("shows court occupancy, match controls, and polls active tournaments", () => {
    const teams = makeTeams(2);
    const liveMatch = makeMatch({
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const initialTournament = {
      ...makeTournament({
        name: "Manage Cup",
        status: "active",
        courtsAvailable: 2,
        currentMatchIds: [liveMatch._id],
        teams,
        matches: [liveMatch],
      }),
      updatedAt: new Date(),
    } as ITournament;

    render(<TournamentManageView initialTournament={initialTournament} />);

    const [, , options] = useSWR.mock.calls[0];

    expect(options.refreshInterval(initialTournament)).toBe(5000);
    expect(screen.getByRole("heading", { name: "Manage Cup" })).toBeInTheDocument();
    expect(screen.getByText("1/2 courts in use")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter scores" })).toBeInTheDocument();
  });

  it("stops polling and shows standings for a completed tournament", () => {
    const initialTournament = {
      ...makeTournament({
        name: "Done Cup",
        status: "completed",
      }),
      updatedAt: new Date(),
    } as ITournament;

    render(<TournamentManageView initialTournament={initialTournament} />);

    const [, , options] = useSWR.mock.calls[0];

    expect(options.refreshInterval(initialTournament)).toBe(0);
    expect(screen.getByTestId("tournament-complete")).toBeInTheDocument();
  });
});
