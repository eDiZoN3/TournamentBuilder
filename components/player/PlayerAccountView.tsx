"use client";

import { signOut } from "next-auth/react";
import { useLocale } from "@/components/ui/LocaleProvider";

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
  profile: PlayerAccountProfile;
  stats: PlayerAccountStats | null;
}

export function PlayerAccountView({ profile, stats }: PlayerAccountViewProps) {
  const { t } = useLocale();

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

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("matches")}</p>
            <p className="mt-1 text-2xl font-bold">{stats.matchesPlayed}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("wins")}</p>
            <p className="mt-1 text-2xl font-bold">{stats.matchesWon}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("points")}</p>
            <p className="mt-1 text-2xl font-bold">{stats.pointsFor}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("winRate")}</p>
            <p className="mt-1 text-2xl font-bold">
              {Math.round(stats.winRate * 100)}%
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-white">No completed matches yet.</p>
        </div>
      )}
    </section>
  );
}
