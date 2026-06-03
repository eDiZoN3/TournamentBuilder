import type { ITournament, TournamentFormat } from "@/lib/models/Tournament";
import { calculateTournamentStats, type StatsRow } from "@/lib/stats";

export interface NonKnockoutStandingRow {
  entity: "team" | "player";
  losses: number;
  matchesPlayed: number;
  name: string;
  pointDiff: number;
  pointsAgainst: number;
  pointsFor: number;
  rank: number;
  wins: number;
}

function formatFor(tournament: ITournament): TournamentFormat {
  return tournament.format ?? "double_elimination";
}

function compareRows(first: StatsRow, second: StatsRow): number {
  return (
    second.matchesWon - first.matchesWon ||
    second.pointDiff - first.pointDiff ||
    second.pointsFor - first.pointsFor ||
    first.name.localeCompare(second.name)
  );
}

export function isNonKnockoutFormat(format: TournamentFormat | undefined): boolean {
  return format === "team_round_robin" || format === "individual_mixer";
}

export function buildNonKnockoutStandings(
  tournament: ITournament,
): NonKnockoutStandingRow[] {
  const format = formatFor(tournament);
  const stats = calculateTournamentStats(tournament);
  const entity = format === "individual_mixer" ? "player" : "team";
  const rows = entity === "player" ? stats.players : stats.teams;

  return [...rows].sort(compareRows).map((row, index) => ({
    entity,
    losses: row.matchesLost,
    matchesPlayed: row.matchesPlayed,
    name: row.name,
    pointDiff: row.pointDiff,
    pointsAgainst: row.pointsAgainst,
    pointsFor: row.pointsFor,
    rank: index + 1,
    wins: row.matchesWon,
  }));
}
