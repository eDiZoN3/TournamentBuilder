"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { BracketView } from "@/components/bracket/BracketView";
import { BracketSkeleton } from "@/components/bracket/MatchCardSkeleton";
import { StandingsTable } from "@/components/bracket/StandingsTable";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ITournament } from "@/lib/models/Tournament";

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
  return (
    <section
      className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"
      data-testid="tournament-complete"
    >
      <h2 className="text-xl font-bold text-emerald-900">
        Tournament complete
      </h2>
      <div className="mt-4">
        <StandingsTable tournament={tournament} />
      </div>
    </section>
  );
}

export function PublicTournamentView({
  initialTournament,
}: PublicTournamentViewProps) {
  const refreshFailures = useRef(0);
  const [unableToRefresh, setUnableToRefresh] = useState(false);
  const { data, isLoading } = useSWR<ITournament>(
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
  const tournament = data ?? initialTournament;
  const showSkeleton = isLoading && !data;

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
        <ErrorBanner
          message="Unable to refresh"
          onDismiss={() => setUnableToRefresh(false)}
        />
      ) : null}
      {tournament.status === "completed" ? (
        <FinalStandings tournament={tournament} />
      ) : null}
      {showSkeleton ? (
        <BracketSkeleton />
      ) : (
        <BracketView matches={tournament.matches} teams={tournament.teams} />
      )}
    </section>
  );
}
