// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
            winnerId: nextMatch.teamA!.teamId.toString(),
          }),
        }),
      );
      expect(onUpdated).toHaveBeenCalled();
    });
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
