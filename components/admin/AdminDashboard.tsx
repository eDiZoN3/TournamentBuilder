"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AdminUsersPanel,
  type AdminUserSummary,
} from "@/components/admin/AdminUsersPanel";
import { TournamentDeleteControl } from "@/components/admin/TournamentDeleteControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
  initialTournaments: TournamentSummary[];
}

export function AdminDashboard({
  initialAdmins = [],
  initialTournaments,
}: AdminDashboardProps) {
  const [tournaments, setTournaments] = useState(initialTournaments);

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-slate-600">Manage volleyball tournaments.</p>
        </div>
        <Link
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          href="/admin/tournament/new"
        >
          Create New Tournament
        </Link>
      </header>
      <div className="mt-8">
        <AdminUsersPanel initialAdmins={initialAdmins} />
      </div>
      {tournaments.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            action={
              <Link
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                href="/admin/tournament/new"
              >
                Create New Tournament
              </Link>
            }
            description="Create one to start scheduling matches."
            title="No tournaments yet."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {tournaments.map((tournament) => (
            <article
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              key={tournament._id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {tournament.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {tournament.teamCount} teams / {tournament.matchCount} matches
                  </p>
                </div>
                <StatusBadge status={tournament.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {tournament.status === "draft" ? (
                  <Link
                    aria-label={`Setup ${tournament.name}`}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
                    href={`/admin/tournament/${tournament._id}/setup`}
                  >
                    Setup
                  </Link>
                ) : null}
                {tournament.status === "active" ? (
                  <Link
                    aria-label={`Manage ${tournament.name}`}
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                    href={`/admin/tournament/${tournament._id}/manage`}
                  >
                    Manage
                  </Link>
                ) : null}
                <Link
                  aria-label={`View ${tournament.name}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
                  href={`/tournament/${tournament._id}`}
                >
                  View
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
