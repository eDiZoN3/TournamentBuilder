"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { MatchControls } from "@/components/admin/MatchControls";
import { TournamentDeleteControl } from "@/components/admin/TournamentDeleteControl";
import { TournamentThemePicker } from "@/components/admin/TournamentThemePicker";
import { BracketView } from "@/components/bracket/BracketView";
import { CrestProvider } from "@/components/bracket/CrestContext";
import { BracketSkeleton } from "@/components/bracket/MatchCardSkeleton";
import { FinalStandings } from "@/components/bracket/PublicTournamentView";
import { EventTournamentView } from "@/components/event/EventTournamentView";
import { RoundRobinView } from "@/components/tournament/RoundRobinView";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useLocale } from "@/components/ui/LocaleProvider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { formatTranslation } from "@/lib/i18n";
import type { IMatch, ITournament } from "@/lib/models/Tournament";
import { isNonKnockoutFormat } from "@/lib/standings/nonKnockout";
import { resolveTournamentTheme } from "@/lib/tournamentTheme";

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
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const router = useRouter();
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
  const activeTheme = resolveTournamentTheme(tournament.theme);
  const winnerOnly = (tournament.matchResultMode ?? "points") === "winner_only";

  async function selectBracketWinner(match: IMatch, winnerSide: "A" | "B") {
    try {
      const response = await fetch(
        `/api/tournaments/${tournament._id.toString()}/matches/${match._id.toString()}/status`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: "completed", winnerSide }),
        },
      );

      if (!response.ok) {
        showToast({
          message: t("unableToConfirmMatch"),
          title: t("unableToConfirmMatch"),
          type: "error",
        });
        return;
      }

      await mutate();
      showToast({
        message: formatTranslation(locale, "matchCompleted", {
          match: match.label,
        }),
        title: t("matchConfirmed"),
        type: "success",
      });
    } catch {
      showToast({
        message: t("unableToConfirmMatch"),
        title: t("unableToConfirmMatch"),
        type: "error",
      });
    }
  }

  return (
    <CrestProvider
      active={activeTheme === "knight"}
      editable
      onCrestUpdated={async () => {
        await mutate();
      }}
      teams={tournament.teams}
      tournamentId={tournament._id.toString()}
    >
    <section
      className="tournament-theme-root space-y-6"
      data-tournament-theme={activeTheme}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("tournamentManagement")}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {tournament.name}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            {formatTranslation(locale, "courtsInUse", {
              current: tournament.currentMatchIds.length,
              total: tournament.courtsAvailable,
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TournamentThemePicker
            currentTheme={tournament.theme}
            onUpdated={async () => {
              await mutate();
            }}
            tournamentId={tournament._id.toString()}
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={tournament.status} />
            <TournamentDeleteControl
              onDeleted={() => router.push("/admin/dashboard")}
              tournament={tournament}
            />
          </div>
        </div>
      </header>
      {unableToRefresh ? (
        <ErrorBanner
          message={t("unableToRefresh")}
          onDismiss={() => setUnableToRefresh(false)}
        />
      ) : null}
      {tournament.status === "completed" && tournament.format !== "event" ? (
        <FinalStandings tournament={tournament} />
      ) : null}
      {showSkeleton ? (
        <BracketSkeleton />
      ) : tournament.format === "event" ? (
        <EventTournamentView
          editable={!unableToRefresh}
          syncHealthy={!unableToRefresh}
          onUpdated={async () => {
            await mutate();
          }}
          tournament={tournament}
        />
      ) : isNonKnockoutFormat(tournament.format) ? (
        <RoundRobinView
          renderMatchControls={(match, teamAName, teamBName) => (
            <MatchControls
              courtsAvailable={tournament.courtsAvailable}
              currentMatchIds={tournament.currentMatchIds}
              key={match._id.toString()}
              match={match}
              matchResultMode={tournament.matchResultMode ?? "points"}
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
          tournament={tournament}
        />
      ) : (
        <BracketView
          matches={tournament.matches}
          onSelectWinner={winnerOnly ? selectBracketWinner : undefined}
          pinnedMatchId={pinnedMatchId}
          renderMatchControls={(match, teamAName, teamBName) => (
            <MatchControls
              courtsAvailable={tournament.courtsAvailable}
              currentMatchIds={tournament.currentMatchIds}
              key={match._id.toString()}
              match={match}
              matchResultMode={tournament.matchResultMode ?? "points"}
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
    </CrestProvider>
  );
}
