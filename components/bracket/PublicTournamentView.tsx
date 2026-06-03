"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { BracketView } from "@/components/bracket/BracketView";
import { BracketSkeleton } from "@/components/bracket/MatchCardSkeleton";
import { StandingsTable } from "@/components/bracket/StandingsTable";
import { JoinTournamentButton } from "@/components/player/JoinTournamentButton";
import { TournamentStats } from "@/components/stats/TournamentStats";
import { RoundRobinView } from "@/components/tournament/RoundRobinView";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useLocale } from "@/components/ui/LocaleProvider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ITournament } from "@/lib/models/Tournament";
import { isNonKnockoutFormat } from "@/lib/standings/nonKnockout";

interface PublicTournamentViewProps {
  currentPlayerName?: string | null;
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
  const { t } = useLocale();

  return (
    <section
      className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950"
      data-testid="tournament-complete"
    >
      <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
        {t("tournamentComplete")}
      </h2>
      <div className="mt-4">
        <StandingsTable tournament={tournament} />
      </div>
    </section>
  );
}

export function PublicTournamentView({
  currentPlayerName = null,
  initialTournament,
}: PublicTournamentViewProps) {
  const { t } = useLocale();
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
  const joinedPlayers = tournament.joinedPlayers ?? [];
  const currentPlayerJoined = Boolean(
    currentPlayerName &&
      joinedPlayers.some(
        (player) =>
          player.displayName.trim().toLowerCase() ===
          currentPlayerName.trim().toLowerCase(),
      ),
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("tournamentBracket")}
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
      {tournament.status === "draft" &&
      tournament.allowSelfJoin &&
      tournament.inputMode === "players" ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Join phase</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {joinedPlayers.length} player{joinedPlayers.length === 1 ? "" : "s"} joined
              </p>
            </div>
            <JoinTournamentButton
              currentPlayerName={currentPlayerName}
              initiallyJoined={currentPlayerJoined}
              tournamentId={tournament._id.toString()}
            />
          </div>
          {joinedPlayers.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2 text-sm">
              {joinedPlayers.map((player) => (
                <li
                  className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  key={player.userId.toString()}
                >
                  {player.displayName}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
      {showSkeleton ? (
        <BracketSkeleton />
      ) : isNonKnockoutFormat(tournament.format) ? (
        <RoundRobinView
          currentPlayerName={currentPlayerName}
          tournament={tournament}
        />
      ) : (
        <BracketView
          currentPlayerName={currentPlayerName}
          matches={tournament.matches}
          teams={tournament.teams}
        />
      )}
      <TournamentStats tournament={tournament} />
    </section>
  );
}
