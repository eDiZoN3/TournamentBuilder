"use client";

import type { ReactNode } from "react";
import { StandingsTable } from "@/components/bracket/StandingsTable";
import { UpNextBanner } from "@/components/bracket/UpNextBanner";
import { resolveTeamName } from "@/components/bracket/utils";
import type { IMatch, ITournament } from "@/lib/models/Tournament";

interface RoundRobinViewProps {
  currentPlayerName?: string | null;
  renderMatchControls?: (
    match: IMatch,
    teamAName: string,
    teamBName: string,
  ) => ReactNode;
  tournament: ITournament;
}

function groupedRounds(matches: IMatch[]): Array<[number, IMatch[]]> {
  const groups = new Map<number, IMatch[]>();

  for (const match of matches) {
    groups.set(match.round, [...(groups.get(match.round) ?? []), match]);
  }

  return [...groups.entries()]
    .sort(([first], [second]) => first - second)
    .map(([round, roundMatches]) => [
      round,
      roundMatches.sort(
        (first, second) => first.position - second.position,
      ),
    ]);
}

function scoreFor(match: IMatch): string {
  const sets = match.teamA?.sets.length
    ? match.teamA.sets
    : (match.teamB?.sets ?? []);

  if (sets.length === 0) {
    return "-";
  }

  return sets.map((set) => `${set.scoreA}-${set.scoreB}`).join(", ");
}

function statusLabel(match: IMatch): string {
  if (match.status === "in_progress") {
    return match.courtNumber ? `Live, court ${match.courtNumber}` : "Live";
  }

  return match.status.replace("_", " ");
}

export function RoundRobinView({
  currentPlayerName = null,
  renderMatchControls,
  tournament,
}: RoundRobinViewProps) {
  const rounds = groupedRounds(tournament.matches);

  return (
    <section className="space-y-6" data-testid="round-robin-view">
      <UpNextBanner matches={tournament.matches} teams={tournament.teams} />
      <StandingsTable
        currentPlayerName={currentPlayerName}
        title="Standings"
        tournament={tournament}
      />
      <section>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Schedule
        </h2>
        <div className="mt-4 space-y-5">
          {rounds.map(([round, matches]) => (
            <section key={round}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Round {round}
              </h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      <th className="py-2 pr-4 font-semibold">Match</th>
                      <th className="px-4 py-2 font-semibold">Teams</th>
                      <th className="px-4 py-2 font-semibold">Score</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                      {renderMatchControls ? (
                        <th className="py-2 pl-4 font-semibold">Controls</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {matches.map((match) => {
                      const teamAName =
                        resolveTeamName(
                          tournament.teams,
                          match.teamA?.teamId ?? null,
                        ) ?? "TBD";
                      const teamBName =
                        resolveTeamName(
                          tournament.teams,
                          match.teamB?.teamId ?? null,
                        ) ?? "TBD";

                      return (
                        <tr key={match._id.toString()}>
                          <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                            {match.position}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            {teamAName} vs {teamBName}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">
                            {scoreFor(match)}
                          </td>
                          <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">
                            {statusLabel(match)}
                          </td>
                          {renderMatchControls ? (
                            <td className="min-w-64 py-3 pl-4">
                              {renderMatchControls(match, teamAName, teamBName)}
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </section>
    </section>
  );
}
