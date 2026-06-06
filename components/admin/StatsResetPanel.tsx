"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/components/ui/LocaleProvider";
import { translate } from "@/lib/i18n";
import type { TournamentSummary } from "@/components/admin/AdminDashboard";
import type { PlayerUserSummary } from "@/components/admin/PlayerUsersPanel";

const CONFIRMATION_PHRASE = "RESET STATS";

type ResetScope = "player" | "tournament" | "season" | "all";

interface StatsResetPanelProps {
  currentUserRole: "admin" | "tournament_lead";
  players: PlayerUserSummary[];
  seasons: number[];
  tournaments: TournamentSummary[];
  onResetComplete?: () => void;
}

function defaultTarget<T extends { _id: string }>(entries: T[]): string {
  return entries[0]?._id ?? "";
}

export function StatsResetPanel({
  currentUserRole,
  onResetComplete,
  players,
  seasons,
  tournaments,
}: StatsResetPanelProps) {
  const { locale } = useLocale();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [scope, setScope] = useState<ResetScope>("player");
  const [selectedPlayerId, setSelectedPlayerId] = useState(defaultTarget(players));
  const [selectedSeason, setSelectedSeason] = useState(
    seasons[0]?.toString() ?? "",
  );
  const [selectedTournamentId, setSelectedTournamentId] = useState(
    defaultTarget(tournaments),
  );

  if (currentUserRole !== "admin") {
    return (
      <section
        aria-labelledby="stats-reset-title"
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <h2
          className="text-lg font-semibold text-slate-900 dark:text-white"
          id="stats-reset-title"
        >
          {translate(locale, 'statsReset')}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {translate(locale, 'onlyAdminsCanReset')}
        </p>
      </section>
    );
  }

  function handleScopeChange(nextScope: ResetScope) {
    setScope(nextScope);
    setError(null);
    setMessage(null);

    if (nextScope === "player") {
      setSelectedPlayerId(defaultTarget(players));
    }

    if (nextScope === "tournament") {
      setSelectedTournamentId(defaultTarget(tournaments));
    }

    if (nextScope === "season") {
      setSelectedSeason(seasons[0]?.toString() ?? "");
    }
  }

  function hasRequiredTarget(): boolean {
    if (scope === "player") {
      return Boolean(selectedPlayerId);
    }

    if (scope === "tournament") {
      return Boolean(selectedTournamentId);
    }

    if (scope === "season") {
      return Boolean(selectedSeason);
    }

    return true;
  }

  function buildPayload() {
    if (scope === "player") {
      return {
        scope,
        playerProfileId: selectedPlayerId,
        confirmation,
      };
    }

    if (scope === "tournament") {
      return {
        scope,
        tournamentId: selectedTournamentId,
        confirmation,
      };
    }

    if (scope === "season") {
      return {
        scope,
        season: Number(selectedSeason),
        confirmation,
      };
    }

    return {
      scope,
      confirmation,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (confirmation !== CONFIRMATION_PHRASE || !hasRequiredTarget()) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/stats/reset", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? translate(locale, 'unableToUpdateMatch'));
      }

      setMessage(translate(locale, "statsResetComplete"));
      onResetComplete?.();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : translate(locale, 'unableToUpdateMatch'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    confirmation === CONFIRMATION_PHRASE && hasRequiredTarget() && !isSubmitting;

  return (
    <section
      aria-labelledby="stats-reset-title"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <h2
        className="text-lg font-semibold text-slate-900 dark:text-white"
        id="stats-reset-title"
      >
        {translate(locale, 'statsReset')}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {translate(locale, 'onlyAdminsCanReset')}
      </p>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {translate(locale, 'resetScope')}
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-950 dark:focus:ring-slate-700"
            onChange={(event) =>
              handleScopeChange(event.target.value as ResetScope)
            }
            value={scope}
          >
            <option value="player">{translate(locale, 'resetScopePlayer')}</option>
            <option value="tournament">{translate(locale, 'resetScopeTournament')}</option>
            <option value="season">{translate(locale, 'resetScopeSeason')}</option>
            <option value="all">{translate(locale, 'resetScopeAll')}</option>
          </select>
        </label>

        {scope === "player" ? (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {translate(locale, 'resetScopePlayer')}
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-950 dark:focus:ring-slate-700"
              onChange={(event) => setSelectedPlayerId(event.target.value)}
              value={selectedPlayerId}
            >
              {players.map((player) => (
                <option key={player._id} value={player._id}>
                  {player.displayName}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {scope === "tournament" ? (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {translate(locale, 'resetScopeTournament')}
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-950 dark:focus:ring-slate-700"
              onChange={(event) => setSelectedTournamentId(event.target.value)}
              value={selectedTournamentId}
            >
              {tournaments.map((tournament) => (
                <option key={tournament._id} value={tournament._id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {scope === "season" ? (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {translate(locale, 'resetScopeSeason')}
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-950 dark:focus:ring-slate-700"
              onChange={(event) => setSelectedSeason(event.target.value)}
              value={selectedSeason}
            >
              {seasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          htmlFor="stats-reset-confirmation"
        >
          {translate(locale, 'confirmResetStats')}
        </label>
        <input
          className="rounded-md border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-950 dark:focus:ring-slate-700"
          id="stats-reset-confirmation"
          onChange={(event) => setConfirmation(event.target.value)}
          value={confirmation}
        />

        {error ? (
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {message}
          </p>
        ) : null}

        <button
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:bg-white dark:text-slate-950"
          disabled={!canSubmit}
          type="submit"
        >
          {isSubmitting ? translate(locale, 'saving') : translate(locale, 'resetStats')}
        </button>
      </form>
    </section>
  );
}
