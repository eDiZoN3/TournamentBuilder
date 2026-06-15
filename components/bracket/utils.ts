import type { IMatch, ITeam } from "@/lib/models/Tournament";

export function idString(id: { toString(): string } | string | null): string {
  return id?.toString() ?? "";
}

export function resolveTeamName(
  teams: ITeam[],
  teamId: IMatch["winnerId"] | string,
): string | undefined {
  if (!teamId) {
    return undefined;
  }

  return teams.find((team) => idString(team._id) === idString(teamId))?.name;
}

/**
 * Whether a bracket match can have its winner picked by clicking a team row.
 * Only live (ready / in-progress) matches with two known teams qualify.
 */
export function canSelectWinner(match: IMatch): boolean {
  return (
    !match.isBye &&
    Boolean(match.teamA) &&
    Boolean(match.teamB) &&
    (match.status === "ready" || match.status === "in_progress")
  );
}

export function roundsFor(
  matches: IMatch[],
  bracket: IMatch["bracket"],
): Array<[number, IMatch[]]> {
  const rounds = new Map<number, IMatch[]>();

  for (const match of matches) {
    if (match.bracket !== bracket) {
      continue;
    }

    const round = rounds.get(match.round) ?? [];
    round.push(match);
    rounds.set(match.round, round);
  }

  return [...rounds.entries()]
    .sort(([first], [second]) => first - second)
    .map(([round, roundMatches]) => [
      round,
      roundMatches.sort((first, second) => first.position - second.position),
    ]);
}
