"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { PracticeMatchForm } from "@/components/player/PracticeMatchForm";
import { PracticeMatchList } from "@/components/player/PracticeMatchList";
import { useLocale } from "@/components/ui/LocaleProvider";
import type { SerializedPracticeMatch } from "@/lib/practiceMatches";

export interface PlayerAccountProfile {
  _id: string;
  displayName: string;
  email: string;
  firstName: string;
  surname?: string;
  userId: string;
}

export interface PlayerAccountStats {
  matchesPlayed: number;
  matchesWon: number;
  pointsFor: number;
  winRate: number;
}

interface PlayerAccountViewProps {
  practiceMatches?: SerializedPracticeMatch[];
  practiceStats?: PlayerAccountStats | null;
  profile: PlayerAccountProfile;
  stats: PlayerAccountStats | null;
}

function StatsSummary({
  emptyTitle,
  stats,
}: {
  emptyTitle: string;
  stats: PlayerAccountStats | null;
}) {
  const { t } = useLocale();

  if (!stats) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="font-semibold text-slate-900 dark:text-white">
          {emptyTitle}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("matches")}
        </p>
        <p className="mt-1 text-2xl font-bold">{stats.matchesPlayed}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("wins")}
        </p>
        <p className="mt-1 text-2xl font-bold">{stats.matchesWon}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("points")}
        </p>
        <p className="mt-1 text-2xl font-bold">{stats.pointsFor}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("winRate")}
        </p>
        <p className="mt-1 text-2xl font-bold">
          {Math.round(stats.winRate * 100)}%
        </p>
      </div>
    </div>
  );
}

export function PlayerAccountView({
  practiceMatches = [],
  practiceStats = null,
  profile,
  stats,
}: PlayerAccountViewProps) {
  const { t } = useLocale();
  const [practiceMatchRows, setPracticeMatchRows] =
    useState(practiceMatches);
  const [editingMatch, setEditingMatch] =
    useState<SerializedPracticeMatch | null>(null);

  useEffect(() => {
    setPracticeMatchRows(practiceMatches);
  }, [practiceMatches]);

  function savePracticeMatch(match: SerializedPracticeMatch) {
    setPracticeMatchRows((currentMatches) => {
      const hasExistingMatch = currentMatches.some(
        (currentMatch) => currentMatch._id === match._id,
      );

      if (!hasExistingMatch) {
        return [match, ...currentMatches];
      }

      return currentMatches.map((currentMatch) =>
        currentMatch._id === match._id ? match : currentMatch,
      );
    });
    setEditingMatch(null);
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("playerAccount")}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {profile.displayName}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {profile.email}
          </p>
        </div>
        <button
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => signOut({ callbackUrl: "/login" })}
          type="button"
        >
          {t("logOut")}
        </button>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">
          {t("tournamentStats")}
        </h2>
        <StatsSummary emptyTitle="No completed matches yet." stats={stats} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">
          {t("practiceStats")}
        </h2>
        <StatsSummary emptyTitle={t("noPracticeStats")} stats={practiceStats} />
      </section>

      <section className="space-y-3" id="practice-matches">
        <h2 className="text-xl font-bold tracking-tight">
          {t("practiceMatches")}
        </h2>
        <PracticeMatchForm
          currentPlayer={{
            displayName: profile.displayName,
            playerProfileId: profile._id,
          }}
          editingMatch={editingMatch}
          onCancelEdit={() => setEditingMatch(null)}
          onSaved={savePracticeMatch}
        />
        <PracticeMatchList
          currentPlayerProfileId={profile._id}
          matches={practiceMatchRows}
          onDeleted={(id) =>
            setPracticeMatchRows((currentMatches) =>
              currentMatches.filter((match) => match._id !== id),
            )
          }
          onEdit={setEditingMatch}
        />
      </section>
    </section>
  );
}
