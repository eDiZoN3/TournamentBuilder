"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { MatchControls } from "@/components/admin/MatchControls";
import { BracketView } from "@/components/bracket/BracketView";
import { BracketSkeleton } from "@/components/bracket/MatchCardSkeleton";
import { FinalStandings } from "@/components/bracket/PublicTournamentView";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ITournament } from "@/lib/models/Tournament";

interface TournamentManageViewProps {
  initialTournament: ITournament;
}

async function fetchTournament(url: string): Promise<ITournament> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to refresh tournament");
  }

  return response.json() as Promise<ITournament>;
}

export function TournamentManageView({
  initialTournament,
}: TournamentManageViewProps) {
  const refreshFailures = useRef(0);
  const [pinnedMatchId, setPinnedMatchId] = useState<string | null>(null);
  const [unableToRefresh, setUnableToRefresh] = useState(false);
  const { data, isLoading, mutate } = useSWR<ITournament>(
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
            Tournament management
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {tournament.name}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {tournament.currentMatchIds.length}/{tournament.courtsAvailable} courts
            in use
          </p>
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
        <BracketView
          matches={tournament.matches}
          pinnedMatchId={pinnedMatchId}
          renderMatchControls={(match, teamAName, teamBName) => (
            <MatchControls
              courtsAvailable={tournament.courtsAvailable}
              currentMatchIds={tournament.currentMatchIds}
              key={match._id.toString()}
              match={match}
              onScoreEntryClose={() => setPinnedMatchId(null)}
              onScoreEntryOpen={setPinnedMatchId}
              onUpdated={async () => {
                await mutate();
              }}
              teamAName={teamAName}
              teamBName={teamBName}
              tournamentId={tournament._id.toString()}
            />
          )}
          teams={tournament.teams}
        />
      )}
    </section>
  );
}
