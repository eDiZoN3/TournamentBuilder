"use client";

import { type FormEvent, useState } from "react";
import type { PlayerUserSummary } from "@/lib/admin/playerAccounts";

interface PlayerUsersPanelProps {
  initialPlayers: PlayerUserSummary[];
}

interface PlayerResponse {
  player: PlayerUserSummary;
  temporaryPassword: string;
}

export type { PlayerUserSummary };

function errorMessage(body: PlayerResponse | { error?: string }, fallback: string) {
  return "error" in body && body.error ? body.error : fallback;
}

export function PlayerUsersPanel({ initialPlayers }: PlayerUsersPanelProps) {
  const [players, setPlayers] = useState(initialPlayers);
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdPlayer, setCreatedPlayer] = useState<PlayerResponse | null>(null);
  const [resetPlayer, setResetPlayer] = useState<PlayerResponse | null>(null);
  const [resettingPlayerId, setResettingPlayerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function showTemporaryPassword(result: PlayerResponse, type: "create" | "reset") {
    if (type === "create") {
      setCreatedPlayer(result);
      setResetPlayer(null);
    } else {
      setResetPlayer(result);
      setCreatedPlayer(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreatedPlayer(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/players", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
          surname: surname.trim(),
        }),
      });
      const body = (await response.json()) as PlayerResponse | { error?: string };

      if (!response.ok) {
        setError(errorMessage(body, "Unable to create player account."));
        return;
      }

      const result = body as PlayerResponse;

      setPlayers((current) => [result.player, ...current]);
      showTemporaryPassword(result, "create");
      setFirstName("");
      setSurname("");
      setEmail("");
    } catch {
      setError("Unable to create player account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resetPassword(player: PlayerUserSummary) {
    setError(null);
    setResettingPlayerId(player._id);

    try {
      const response = await fetch(
        `/api/admin/players/${player._id}/reset-password`,
        {
          method: "POST",
        },
      );
      const body = (await response.json()) as PlayerResponse | { error?: string };

      if (!response.ok) {
        setError(errorMessage(body, "Unable to reset player password."));
        return;
      }

      const result = body as PlayerResponse;

      setPlayers((current) =>
        current.map((entry) =>
          entry._id === result.player._id ? result.player : entry,
        ),
      );
      showTemporaryPassword(result, "reset");
    } catch {
      setError("Unable to reset player password.");
    } finally {
      setResettingPlayerId(null);
    }
  }

  const temporaryPassword = createdPlayer ?? resetPlayer;

  return (
    <section
      aria-labelledby="player-accounts-title"
      className="w-full max-w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div>
        <h2
          className="text-lg font-semibold text-slate-900 dark:text-white"
          id="player-accounts-title"
        >
          Player accounts
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Register players and reset account passwords.
        </p>
      </div>

      <form
        className="mt-5 grid min-w-0 gap-3 md:grid-cols-4"
        onSubmit={handleSubmit}
      >
        <div className="min-w-0">
          <label
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            htmlFor="new-player-first-name"
          >
            Player first name
          </label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:focus:ring-slate-700"
            id="new-player-first-name"
            maxLength={50}
            onChange={(event) => setFirstName(event.target.value)}
            required
            value={firstName}
          />
        </div>
        <div className="min-w-0">
          <label
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            htmlFor="new-player-surname"
          >
            Player surname
          </label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:focus:ring-slate-700"
            id="new-player-surname"
            maxLength={50}
            onChange={(event) => setSurname(event.target.value)}
            value={surname}
          />
        </div>
        <div className="min-w-0">
          <label
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            htmlFor="new-player-email"
          >
            Player email
          </label>
          <input
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:focus:ring-slate-700"
            id="new-player-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>
        <div className="flex items-end">
          <button
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating..." : "Create player"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="mt-3 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {temporaryPassword ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Temporary password</p>
              <p className="mt-1 font-mono text-lg">
                {temporaryPassword.temporaryPassword}
              </p>
              <p className="mt-1 text-sm">
                Share it once. This player must change it on next login.
              </p>
            </div>
            <button
              aria-label="Dismiss temporary password"
              className="rounded-md border border-amber-300 px-3 py-2 text-sm font-semibold dark:border-amber-600"
              onClick={() => {
                setCreatedPlayer(null);
                setResetPlayer(null);
              }}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 w-full max-w-full overflow-x-auto">
        {players.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No player accounts yet.
          </p>
        ) : (
          <table className="w-full min-w-max text-left text-sm">
            <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">Email</th>
                <th className="py-2 pr-4 font-semibold">Status</th>
                <th className="py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {players.map((player) => (
                <tr key={player._id}>
                  <td className="max-w-64 break-words py-3 pr-4 font-medium text-slate-900 dark:text-white">
                    {player.displayName}
                  </td>
                  <td className="max-w-72 break-all py-3 pr-4 text-slate-600 dark:text-slate-300">
                    {player.email}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                    {player.mustChangePassword
                      ? "Password change required"
                      : "Active"}
                  </td>
                  <td className="py-3">
                    <button
                      aria-label={`Reset ${player.displayName} password`}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-600"
                      disabled={resettingPlayerId === player._id}
                      onClick={() => void resetPassword(player)}
                      type="button"
                    >
                      {resettingPlayerId === player._id ? "Resetting..." : "Reset password"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
