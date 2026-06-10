// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeTeams, makeTournament } from "@/__tests__/helpers/factories";
import { EventTournamentView } from "@/components/event/EventTournamentView";
import {
  generateEventTournamentMatches,
  planEventSlots,
  toggleEventMatchWinner,
} from "@/lib/eventTournament";
import type { ITeam, ITournament } from "@/lib/models/Tournament";

describe("EventTournamentView bracket clicks", () => {
  it("toggles the winner when clicking a completed match in the bracket tree", async () => {
    const teams = makeTeams(4) as ITeam[];
    const matches = generateEventTournamentMatches(teams, ["Darts"], 7);
    const tournament = makeTournament({
      format: "event",
      name: "Event Cup",
      status: "active",
      teams,
      matches,
    }) as ITournament;

    // Complete the first round-1 match so it only shows inside the bracket.
    const firstMatch = tournament.matches.find(
      (match) => match.round === 1 && !match.isBye && match.teamA && match.teamB,
    )!;
    toggleEventMatchWinner(tournament, firstMatch, firstMatch.teamA!.teamId);

    const winnerName = teams.find(
      (team) => team._id.toString() === firstMatch.winnerId!.toString(),
    )!.name;

    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ selected: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetch);

    render(<EventTournamentView editable tournament={tournament} />);

    const buttons = screen.getAllByRole("button", {
      name: `Select ${winnerName} as winner`,
    });

    // The completed winner only appears as a clickable row in the bracket.
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/tournaments/${tournament._id.toString()}/event/matches/${firstMatch._id.toString()}/winner`,
        expect.objectContaining({ method: "PUT" }),
      );
    });
  });

  it("jumps to the matching bracket tab when an up-next match is clicked", () => {
    const scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

    const teams = makeTeams(4) as ITeam[];
    const matches = generateEventTournamentMatches(teams, ["Darts", "Quiz"], 7);
    const tournament = makeTournament({
      format: "event",
      name: "Event Cup",
      status: "active",
      teams,
      matches,
    }) as ITournament;
    const slotMatch = planEventSlots(matches)[0].matches[0];
    const disciplineName = slotMatch.eventDisciplineName!;

    const { container } = render(
      <EventTournamentView editable tournament={tournament} />,
    );

    const card = container.querySelector('[title="View in bracket"]')!;
    fireEvent.click(card);

    expect(
      screen.getByRole("tab", { name: disciplineName }),
    ).toHaveAttribute("aria-selected", "true");
    expect(scrollIntoView).toHaveBeenCalled();
  });
});
