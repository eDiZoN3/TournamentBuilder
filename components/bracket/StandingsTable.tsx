import type { IMatch, ITeam, ITournament } from "@/lib/models/Tournament";

interface StandingRow {
  place: number;
  team: ITeam;
}

function idString(id: { toString(): string } | null | undefined): string {
  return id?.toString() ?? "";
}

function ordinal(value: number): string {
  const mod100 = value % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`;
  }

  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

function placeRange(match: IMatch): [number, number] | null {
  if (!match.placeRange.includes("Place")) {
    return null;
  }

  const places = [...match.placeRange.matchAll(/\d+/g)].map(([place]) =>
    Number(place),
  );

  if (places.length === 0) {
    return null;
  }

  return [places[0], places[1] ?? places[0]];
}

function teamById(teams: ITeam[], teamId: IMatch["winnerId"]): ITeam | null {
  const team = teams.find((candidate) => idString(candidate._id) === idString(teamId));

  return team ?? null;
}

export function buildStandings(tournament: ITournament): StandingRow[] {
  const rows: StandingRow[] = [];
  const seenTeamIds = new Set<string>();

  function add(place: number, teamId: IMatch["winnerId"] | undefined) {
    const team = teamById(tournament.teams, teamId ?? null);

    if (!team || seenTeamIds.has(idString(team._id))) {
      return;
    }

    seenTeamIds.add(idString(team._id));
    rows.push({ place, team });
  }

  const wbFinal = tournament.matches.find((match) => match.isWBFinal);
  const lbFinal = tournament.matches.find((match) => match.isLBFinal);

  add(1, wbFinal?.winnerId);
  add(2, wbFinal?.loserId);
  add(3, lbFinal?.winnerId);
  add(4, lbFinal?.loserId);

  const eliminationGroups = new Map<
    string,
    {
      end: number;
      matches: IMatch[];
      start: number;
    }
  >();

  for (const match of tournament.matches) {
    if (
      match.bracket !== "loser" ||
      match.isLBFinal ||
      match.status !== "completed" ||
      !match.loserId
    ) {
      continue;
    }

    const range = placeRange(match);

    if (!range) {
      continue;
    }

    const [start, end] = range;
    const key = `${start}-${end}`;
    const group = eliminationGroups.get(key) ?? {
      end,
      matches: [],
      start,
    };

    group.matches.push(match);
    eliminationGroups.set(key, group);
  }

  [...eliminationGroups.values()]
    .sort((first, second) => first.start - second.start)
    .forEach((group) => {
      group.matches
        .sort(
          (first, second) =>
            first.round - second.round || first.position - second.position,
        )
        .forEach((match, index) => {
          add(Math.min(group.start + index, group.end), match.loserId);
        });
    });

  return rows.sort((first, second) => first.place - second.place);
}

export function StandingsTable({ tournament }: { tournament: ITournament }) {
  const standings = buildStandings(tournament);

  return (
    <section>
      <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">Final standings</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-emerald-200 text-xs uppercase tracking-wide text-emerald-800 dark:border-emerald-800 dark:text-emerald-200">
              <th className="py-2 pr-4 font-semibold">Place</th>
              <th className="px-4 py-2 font-semibold">Team</th>
              <th className="py-2 pl-4 font-semibold">Players</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100 dark:divide-emerald-900">
            {standings.map(({ place, team }) => (
              <tr key={idString(team._id)}>
                <td className="py-3 pr-4 font-bold text-emerald-800 dark:text-emerald-200">
                  {ordinal(place)}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  {team.name}
                </td>
                <td className="py-3 pl-4 text-slate-600 dark:text-slate-300">
                  {team.players.length > 0
                    ? team.players.join(", ")
                    : "No players listed"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
