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
