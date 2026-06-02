"use client";

import Link from "next/link";
import { useState } from "react";
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
  initialTournaments: TournamentSummary[];
}

export function AdminDashboard({ initialTournaments }: AdminDashboardProps) {
  const [tournaments, setTournaments] = useState(initialTournaments);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteTournament(tournament: TournamentSummary) {
    if (confirmDeleteId !== tournament._id) {
      setConfirmDeleteId(tournament._id);
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/tournaments/${tournament._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError("Unable to delete tournament.");
        return;
      }

      setTournaments((current) =>
        current.filter((entry) => entry._id !== tournament._id),
      );
      setConfirmDeleteId(null);
    } catch {
      setError("Unable to delete tournament.");
    }
  }

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
      {error ? (
        <p className="mt-4 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {tournaments.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No tournaments yet.
        </p>
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
                {tournament.status === "draft" ? (
                  <button
                    aria-label={`${
                      confirmDeleteId === tournament._id ? "Confirm Delete" : "Delete"
                    } ${tournament.name}`}
                    className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700"
                    onClick={() => void deleteTournament(tournament)}
                    type="button"
                  >
                    {confirmDeleteId === tournament._id ? "Confirm Delete" : "Delete"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
