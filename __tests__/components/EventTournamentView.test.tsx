// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  makeTeams,
  makeTournament,
} from "@/__tests__/helpers/factories";
import { CrestProvider } from "@/components/bracket/CrestContext";
import { EventTournamentView } from "@/components/event/EventTournamentView";
import {
  generateEventTournamentMatches,
  planEventSlots,
} from "@/lib/eventTournament";
import type { ITeam, ITournament } from "@/lib/models/Tournament";

describe("EventTournamentView", () => {
  it("shows next playable event matches and selects a winner", async () => {
    const teams = makeTeams(4) as ITeam[];
    const matches = generateEventTournamentMatches(teams, ["Darts", "Quiz"], 7);
    const tournament = makeTournament({
      _id: teams[0]._id,
      format: "event",
      name: "Event Cup",
      status: "active",
      teams,
      matches,
    }) as ITournament;
    const nextMatch = planEventSlots(matches)[0].matches[0];
    const winnerName = teams.find(
      (team) => team._id.toString() === nextMatch.teamA!.teamId.toString(),
    )!.name;
    const onUpdated = vi.fn();
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ selected: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetch);

    render(
      <EventTournamentView
        editable
        onUpdated={onUpdated}
        tournament={tournament}
      />,
    );

    expect(screen.getByTestId("event-tournament-view")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Up next" })).toBeInTheDocument();
    expect(screen.getAllByText(nextMatch.eventDisciplineName!).length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getAllByRole("button", {
        name: `Select ${winnerName} as winner`,
      })[0],
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/tournaments/${tournament._id.toString()}/event/matches/${nextMatch._id.toString()}/winner`,
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            tournamentUpdatedAt: new Date(tournament.updatedAt).toISOString(),
            winnerId: nextMatch.teamA!.teamId.toString(),
          }),
        }),
      );
      expect(onUpdated).toHaveBeenCalled();
    });
  });


  it("sends the tournament timestamp and refreshes when the server rejects a stale view", async () => {
    const teams = makeTeams(4) as ITeam[];
    const matches = generateEventTournamentMatches(teams, ["Darts"], 7);
    const tournament = makeTournament({
      _id: teams[0]._id,
      format: "event",
      name: "Event Cup",
      status: "active",
      teams,
      matches,
      updatedAt: new Date("2026-01-01T12:00:00.000Z"),
    }) as ITournament;
    const nextMatch = planEventSlots(matches)[0].matches[0];
    const winnerName = teams.find(
      (team) => team._id.toString() === nextMatch.teamA!.teamId.toString(),
    )!.name;
    const onUpdated = vi.fn();
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: "STALE_TOURNAMENT" }), {
        status: 409,
        headers: {
          "content-type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetch);

    render(
      <EventTournamentView
        editable
        onUpdated={onUpdated}
        tournament={tournament}
      />,
    );

    fireEvent.click(
      screen.getAllByRole("button", {
        name: `Select ${winnerName} as winner`,
      })[0],
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/tournaments/${tournament._id.toString()}/event/matches/${nextMatch._id.toString()}/winner`,
        expect.objectContaining({
          body: JSON.stringify({
            tournamentUpdatedAt: "2026-01-01T12:00:00.000Z",
            winnerId: nextMatch.teamA!.teamId.toString(),
          }),
        }),
      );
      expect(onUpdated).toHaveBeenCalled();
    });

    expect(
      screen.getByText(/This view is no longer current/),
    ).toBeInTheDocument();
  });


  it("shows recalculated upcoming event matches as read-only", () => {
    const teams = makeTeams(4) as ITeam[];
    const matches = generateEventTournamentMatches(teams, ["Darts"], 7);
    const tournament = makeTournament({
      _id: teams[0]._id,
      format: "event",
      name: "Event Cup",
      status: "active",
      teams,
      matches,
    }) as ITournament;
    const [currentSlot, recalculatedSlot] = planEventSlots(matches);
    const currentMatch = currentSlot.matches[0];
    const recalculatedMatch = recalculatedSlot.matches[0];
    const currentWinnerName = teams.find(
      (team) => team._id.toString() === currentMatch.teamA!.teamId.toString(),
    )!.name;
    const recalculatedWinnerName = teams.find(
      (team) => team._id.toString() === recalculatedMatch.teamA!.teamId.toString(),
    )!.name;

    render(<EventTournamentView editable tournament={tournament} />);

    expect(
      screen.getByRole("heading", { name: "Current matches" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Recalculated next matches" }),
    ).toBeInTheDocument();
    const currentPreview = screen.getByTestId("event-current-matches");

    expect(
      within(currentPreview).getByRole("button", {
        name: `Select ${currentWinnerName} as winner`,
      }),
    ).toBeEnabled();
    const recalculatedPreview = screen.getByTestId("event-recalculated-next-matches");

    expect(
      within(recalculatedPreview).queryByRole("button", {
        name: `Select ${recalculatedWinnerName} as winner`,
      }),
    ).not.toBeInTheDocument();
    expect(within(recalculatedPreview).getByText(recalculatedWinnerName)).toBeInTheDocument();
  });

  it("shows knight crests in bracket rows without the seed badge", () => {
    const teams = makeTeams(4) as ITeam[];
    teams[0].seed = 99;
    teams[0].crest = {
      charge: "lion",
      chargeColor: "gold",
      division: "none",
      divisionColor: "white",
      field: "blue",
    };
    const matches = generateEventTournamentMatches(teams, ["Darts"], 7);
    const tournament = makeTournament({
      _id: teams[0]._id,
      format: "event",
      name: "Event Cup",
      status: "active",
      teams,
      matches,
    }) as ITournament;

    const { container } = render(
      <CrestProvider
        active
        teams={tournament.teams}
        tournamentId={tournament._id.toString()}
      >
        <EventTournamentView editable tournament={tournament} />
      </CrestProvider>,
    );

    expect(screen.getAllByRole("img", { name: "Coat of arms" }).length).toBeGreaterThan(0);
    expect(container).not.toHaveTextContent("99");
  });
});
