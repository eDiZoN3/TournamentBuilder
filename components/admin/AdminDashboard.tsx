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
import { StatsResetPanel } from "@/components/admin/StatsResetPanel";
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
  canManageTournamentLeads?: boolean;
  currentUserRole?: "admin" | "tournament_lead";
  initialAdmins?: AdminUserSummary[];
  initialMetrics?: AdminDashboardMetrics;
  initialPlayers?: PlayerUserSummary[];
  initialTournaments: TournamentSummary[];
}

type DashboardTab = "tournaments" | "accounts" | "stats-reset";

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
  canManageTournamentLeads = true,
  currentUserRole,
  initialAdmins = [],
  initialMetrics = defaultMetrics,
  initialPlayers = [],
  initialTournaments,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("tournaments");
  const [tournaments, setTournaments] = useState(initialTournaments);
  const { t } = useLocale();
  const resetRole =
    currentUserRole ?? (canManageTournamentLeads ? "admin" : "tournament_lead");
  const seasons = Array.from(
    new Set(
      initialTournaments.map((tournament) =>
        new Date(tournament.createdAt).getUTCFullYear(),
      ),
    ),
  ).sort((first, second) => second - first);
  const tabs: Array<{ id: DashboardTab; label: string }> = [
    {
      id: "tournaments",
      label: t("tournaments"),
    },
    {
      id: "accounts",
      label: t("accounts"),
    },
    {
      id: "stats-reset",
      label: t("statsReset"),
    },
  ];

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {t("manageVolleyballTournaments")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            href="/admin/tournament/new"
          >
            {t("createNewTournament")}
          </Link>
          <Link
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
            href="/"
          >
            {t("publicTournamentList")}
          </Link>
        </div>
      </header>
      <div className="mt-8">
        <DashboardMetrics metrics={initialMetrics} />
      </div>
      <div className="mt-8 border-b border-slate-200 dark:border-slate-700">
        <div aria-label={t("dashboardSections")} className="flex flex-wrap gap-2" role="tablist">
          {tabs.map((tab) => (
            <button
              aria-selected={activeTab === tab.id}
              className={`rounded-t-md px-4 py-2 text-sm font-semibold ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {activeTab === "accounts" ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <AdminUsersPanel
            canManageTournamentLeads={canManageTournamentLeads}
            initialAdmins={initialAdmins}
          />
          <PlayerUsersPanel initialPlayers={initialPlayers} />
        </div>
      ) : null}
      {activeTab === "stats-reset" ? (
        <div className="mt-8">
          <StatsResetPanel
            currentUserRole={resetRole}
            players={initialPlayers}
            seasons={seasons}
            tournaments={initialTournaments}
          />
        </div>
      ) : null}
      {activeTab === "tournaments" ? (
        tournaments.length === 0 ? (
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
              description={t("emptyTournamentDescription")}
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
                      {tournament.teamCount} {t("teams")} /{" "}
                      {tournament.matchCount} {t("matches")}
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
                    aria-label={`${t("publicView")} ${tournament.name}`}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
                    href={`/tournament/${tournament._id}`}
                  >
                    {t("publicView")}
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
        )
      ) : null}
    </section>
  );
}
