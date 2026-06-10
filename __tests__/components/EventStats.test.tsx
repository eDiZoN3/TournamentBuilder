// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeTournament } from "@/__tests__/helpers/factories";
import { TournamentStats } from "@/components/stats/TournamentStats";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import type { ITournament } from "@/lib/models/Tournament";
import type { StatsResult, StatsRow } from "@/lib/stats";

function row(name: string): StatsRow {
  return {
    name,
    matchesPlayed: 1,
    matchesWon: 1,
    matchesLost: 0,
    setsWon: 1,
    setsLost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDiff: 0,
    winRate: 1,
  } as StatsRow;
}

const stats: StatsResult = {
  teams: [row("Team A")],
  players: [row("Alice")],
};

function renderStats(tournament: ITournament) {
  return render(
    <LocaleProvider>
      <TournamentStats stats={stats} tournament={tournament} />
    </LocaleProvider>,
  );
}

describe("TournamentStats for event tournaments", () => {
  it("hides player stats when an event is run in team mode", () => {
    const tournament = makeTournament({
      format: "event",
      inputMode: "teams",
    }) as ITournament;

    renderStats(tournament);

    expect(screen.getByText("Team A")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("shows player and team stats when an event is run in player mode", () => {
    const tournament = makeTournament({
      format: "event",
      inputMode: "players",
    }) as ITournament;

    renderStats(tournament);

    expect(screen.getByText("Team A")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("hides point-related columns for winner-only tournaments", () => {
    const tournament = makeTournament({
      matchResultMode: "winner_only",
    }) as ITournament;

    renderStats(tournament);

    expect(screen.getByText("Team A")).toBeInTheDocument();
    expect(screen.queryByText("Points +/-")).not.toBeInTheDocument();
    expect(screen.queryByText("Sets W-L")).not.toBeInTheDocument();
  });

  it("keeps point-related columns for points-based tournaments", () => {
    const tournament = makeTournament({
      matchResultMode: "points",
    }) as ITournament;

    renderStats(tournament);

    expect(screen.getAllByText("Points +/-").length).toBeGreaterThan(0);
  });
});
