// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMatch, makeTeams, makeTournament } from "@/__tests__/helpers/factories";
import type { ITournament } from "@/lib/models/Tournament";

const { useSWR } = vi.hoisted(() => ({
  useSWR: vi.fn(),
}));

vi.mock("swr", () => ({
  default: useSWR,
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const mockedUseRouter = vi.mocked(useRouter);
const push = vi.fn();
const refresh = vi.fn();

import { TournamentManageView } from "@/components/admin/TournamentManageView";

describe("TournamentManageView", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    mockedUseRouter.mockReturnValue({ push, refresh } as never);
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

  it("pins the active match card while score entry is open and unpins on dismiss", () => {
    const teams = makeTeams(2);
    const liveMatch = makeMatch({
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const initialTournament = {
      ...makeTournament({
        name: "Pinned Cup",
        status: "active",
        courtsAvailable: 1,
        currentMatchIds: [liveMatch._id],
        teams,
        matches: [liveMatch],
      }),
      updatedAt: new Date(),
    } as ITournament;

    render(<TournamentManageView initialTournament={initialTournament} />);

    const card = screen.getByTestId("match-card");

    expect(card).not.toHaveClass("z-40");

    fireEvent.click(screen.getByRole("button", { name: "Enter scores" }));

    expect(card).toHaveClass("z-40", "opacity-100");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(card).not.toHaveClass("z-40");
  });

  it("renders admin controls for non-knockout schedule matches", () => {
    const teams = makeTeams(2);
    const liveMatch = makeMatch({
      label: "Round 1",
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const initialTournament = {
      ...makeTournament({
        format: "team_round_robin",
        name: "League Admin Cup",
        status: "active",
        courtsAvailable: 1,
        currentMatchIds: [liveMatch._id],
        teams,
        matches: [liveMatch],
      }),
      updatedAt: new Date(),
    } as ITournament;

    render(<TournamentManageView initialTournament={initialTournament} />);

    expect(screen.getByTestId("round-robin-view")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Winner bracket" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter scores" })).toBeInTheDocument();
  });

  it("uses fixed round-robin table columns and highlights the active admin round", () => {
    const teams = makeTeams(3);
    const liveMatch = makeMatch({
      label: "Round 2",
      round: 2,
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[2]._id, sets: [] },
    });
    const initialTournament = {
      ...makeTournament({
        format: "team_round_robin",
        name: "League Admin Cup",
        status: "active",
        courtsAvailable: 2,
        currentMatchIds: [liveMatch._id],
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
          liveMatch,
        ],
      }),
      updatedAt: new Date(),
    } as ITournament;

    render(<TournamentManageView initialTournament={initialTournament} />);

    expect(screen.getAllByTestId("round-robin-table")[0]).toHaveClass(
      "table-fixed",
    );
    expect(screen.getByTestId("round-robin-round-2")).toHaveAttribute(
      "data-active-round",
      "true",
    );
    expect(
      within(screen.getByTestId("round-robin-round-2")).getByTestId(
        "round-robin-match-row",
      ),
    ).toHaveClass("bg-emerald-50");
  });

  it("deletes the tournament after typed confirmation and redirects to the dashboard", async () => {
    const teams = makeTeams(2);
    const liveMatch = makeMatch({
      status: "in_progress",
      courtNumber: 1,
      teamA: { teamId: teams[0]._id, sets: [] },
      teamB: { teamId: teams[1]._id, sets: [] },
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const initialTournament = {
      ...makeTournament({
        name: "Delete Me Cup",
        status: "active",
        courtsAvailable: 1,
        currentMatchIds: [liveMatch._id],
        teams,
        matches: [liveMatch],
      }),
      updatedAt: new Date(),
    } as ITournament;

    render(<TournamentManageView initialTournament={initialTournament} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Delete Me Cup" }));
    fireEvent.change(
      screen.getByLabelText("Type Delete Me Cup to confirm deletion"),
      {
        target: { value: "Delete Me Cup" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm Delete Delete Me Cup" }),
    );

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/admin/dashboard");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/tournaments\/.+$/),
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          confirmationName: "Delete Me Cup",
        }),
      },
    );
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

  it("shows a refresh error banner after repeated polling failures", () => {
    const initialTournament = {
      ...makeTournament({ status: "active" }),
      updatedAt: new Date(),
    } as ITournament;

    render(<TournamentManageView initialTournament={initialTournament} />);

    const [, , options] = useSWR.mock.calls[0];

    act(() => {
      options.onError();
      options.onError();
      options.onError();
    });

    expect(screen.getByText("Unable to refresh")).toBeInTheDocument();
  });

  it("renders the theme picker and applies the tournament theme to the wrapper", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    const initialTournament = {
      ...makeTournament({
        name: "Themed Cup",
        status: "active",
        theme: "default",
      }),
      updatedAt: new Date(),
    } as ITournament;

    const { container } = render(
      <TournamentManageView initialTournament={initialTournament} />,
    );

    expect(
      container.querySelector('[data-tournament-theme="default"]'),
    ).not.toBeNull();

    const select = screen.getByLabelText("Theme");

    expect(select).toHaveValue("default");

    fireEvent.change(select, { target: { value: "knight" } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/tournaments\/.+$/),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ theme: "knight" }),
        }),
      );
    });
  });

  it("shows bracket skeletons during an initial SWR load with no data", () => {
    const initialTournament = {
      ...makeTournament({
        name: "Loading Admin Cup",
        status: "active",
      }),
      updatedAt: new Date(),
    } as ITournament;
    useSWR.mockImplementationOnce(() => ({
      data: undefined,
      isLoading: true,
      mutate: vi.fn(),
    }));

    render(<TournamentManageView initialTournament={initialTournament} />);

    expect(screen.getByText("Loading bracket")).toBeInTheDocument();
    expect(screen.getAllByTestId("match-card-skeleton")).toHaveLength(4);
  });
});
