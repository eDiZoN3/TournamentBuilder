"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { BracketView } from "@/components/bracket/BracketView";
import { resolveTeamName } from "@/components/bracket/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { IMatch, ITournament } from "@/lib/models/Tournament";

interface PublicTournamentViewProps {
  initialTournament: ITournament;
}

async function fetchTournament(url: string): Promise<ITournament> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to refresh tournament");
  }

  return response.json() as Promise<ITournament>;
}

export function FinalStandings({ tournament }: { tournament: ITournament }) {
  const wbFinal = tournament.matches.find((match) => match.isWBFinal);
  const lbFinal = tournament.matches.find((match) => match.isLBFinal);
  const placements: Array<{
    place: string;
    teamId: IMatch["winnerId"] | undefined;
  }> = [
    { place: "1st", teamId: wbFinal?.winnerId },
    { place: "2nd", teamId: wbFinal?.loserId },
    { place: "3rd", teamId: lbFinal?.winnerId },
    { place: "4th", teamId: lbFinal?.loserId },
  ];
  const namedPlacements = placements.flatMap(({ place, teamId }) => {
    const teamName = resolveTeamName(tournament.teams, teamId ?? null);

    return teamName ? [{ place, teamName }] : [];
  });

  return (
    <section
      className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"
      data-testid="tournament-complete"
    >
      <h2 className="text-xl font-bold text-emerald-900">
        Tournament complete
      </h2>
      <p className="mt-1 text-sm text-emerald-800">Final standings</p>
      {namedPlacements.length > 0 ? (
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {namedPlacements.map(({ place, teamName }) => (
            <li
              className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
              key={place}
            >
              <span className="block text-xs font-bold uppercase tracking-wide text-emerald-700">
                {place}
              </span>
              <span className="font-semibold text-slate-900">{teamName}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

export function PublicTournamentView({
  initialTournament,
}: PublicTournamentViewProps) {
  const refreshFailures = useRef(0);
  const [unableToRefresh, setUnableToRefresh] = useState(false);
  const { data: tournament = initialTournament } = useSWR<ITournament>(
    `/api/tournaments/${initialTournament._id.toString()}`,
    fetchTournament,
    {
      fallbackData: initialTournament,
      refreshInterval: (latestTournament) =>
        latestTournament?.status === "completed" ? 0 : 5000,
      onError: () => {
        refreshFailures.current += 1;

        if (refreshFailures.current >= 3) {
          setUnableToRefresh(true);
        }
      },
      onSuccess: () => {
        refreshFailures.current = 0;
        setUnableToRefresh(false);
      },
    },
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Tournament bracket
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {tournament.name}
          </h1>
        </div>
        <StatusBadge status={tournament.status} />
      </header>
      {unableToRefresh ? (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
          role="status"
        >
          Unable to refresh
        </p>
      ) : null}
      {tournament.status === "completed" ? (
        <FinalStandings tournament={tournament} />
      ) : null}
      <BracketView matches={tournament.matches} teams={tournament.teams} />
    </section>
  );
}
