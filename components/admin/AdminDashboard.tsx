"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AdminUsersPanel,
  type AdminUserSummary,
} from "@/components/admin/AdminUsersPanel";
import { DashboardMetrics } from "@/components/admin/DashboardMetrics";
import {
  PlayerUsersPanel,
  type PlayerUserSummary,
} from "@/components/admin/PlayerUsersPanel";
import { TournamentDeleteControl } from "@/components/admin/TournamentDeleteControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLocale } from "@/components/ui/LocaleProvider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminDashboardMetrics } from "@/lib/admin/dashboardMetrics";
import type { ITournament } from "@/lib/models/Tournament";

export interface TournamentSummary {
  _id: string;
  name: string;
  status: ITournament["status"];
  createdAt: string;
  teamCount: number;
  matchCount: number;
}

interface AdminDashboardProps {
  initialAdmins?: AdminUserSummary[];
  initialMetrics?: AdminDashboardMetrics;
  initialPlayers?: PlayerUserSummary[];
  initialTournaments: TournamentSummary[];
}

const defaultMetrics: AdminDashboardMetrics = {
  playedMatches: 0,
  registeredAdmins: 0,
  registeredPlayers: 0,
  registeredTournaments: 0,
  tournamentsByStatus: {
    active: 0,
    completed: 0,
    draft: 0,
  },
};

export function AdminDashboard({
  initialAdmins = [],
  initialMetrics = defaultMetrics,
  initialPlayers = [],
  initialTournaments,
}: AdminDashboardProps) {
  const [tournaments, setTournaments] = useState(initialTournaments);
  const { t } = useLocale();

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {t("manageVolleyballTournaments")}
          </p>
        </div>
        <Link
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          href="/admin/tournament/new"
        >
          {t("createNewTournament")}
        </Link>
      </header>
      <div className="mt-8">
        <DashboardMetrics metrics={initialMetrics} />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <AdminUsersPanel initialAdmins={initialAdmins} />
        <PlayerUsersPanel initialPlayers={initialPlayers} />
      </div>
      {tournaments.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            action={
              <Link
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                href="/admin/tournament/new"
              >
                {t("createNewTournament")}
              </Link>
            }
            description="Create one to start scheduling matches."
            title={t("noTournamentsYet")}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {tournaments.map((tournament) => (
            <article
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              key={tournament._id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    {tournament.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {tournament.teamCount} {t("teams").toLowerCase()} /{" "}
                    {tournament.matchCount} {t("matches").toLowerCase()}
                  </p>
                </div>
                <StatusBadge status={tournament.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {tournament.status === "draft" ? (
                  <Link
                    aria-label={`${t("setup")} ${tournament.name}`}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
                    href={`/admin/tournament/${tournament._id}/setup`}
                  >
                    {t("setup")}
                  </Link>
                ) : null}
                {tournament.status === "active" ? (
                  <Link
                    aria-label={`${t("manage")} ${tournament.name}`}
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                    href={`/admin/tournament/${tournament._id}/manage`}
                  >
                    {t("manage")}
                  </Link>
                ) : null}
                <Link
                  aria-label={`${t("view")} ${tournament.name}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
                  href={`/tournament/${tournament._id}`}
                >
                  {t("view")}
                </Link>
                <TournamentDeleteControl
                  onDeleted={() =>
                    setTournaments((current) =>
                      current.filter((entry) => entry._id !== tournament._id),
                    )
                  }
                  tournament={tournament}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
