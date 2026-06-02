"use client";

import { useState } from "react";
import { ScoreEntry } from "@/components/admin/ScoreEntry";
import type { IMatch } from "@/lib/models/Tournament";

interface MatchControlsProps {
  courtsAvailable: number;
  currentMatchIds: Array<string | { toString(): string }>;
  match: IMatch;
  onUpdated: () => void | Promise<void>;
  teamAName: string;
  teamBName: string;
  tournamentId: string;
}

interface ApiError {
  error?: string;
}

async function apiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ApiError;

    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function MatchControls({
  courtsAvailable,
  currentMatchIds,
  match,
  onUpdated,
  teamAName,
  teamBName,
  tournamentId,
}: MatchControlsProps) {
  const [showScores, setShowScores] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (
    match.isBye ||
    (match.status !== "ready" && match.status !== "in_progress")
  ) {
    return null;
  }

  const courtsFull = currentMatchIds.length >= courtsAvailable;

  async function markInProgress() {
    setError(null);
    setIsUpdating(true);

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match._id.toString()}/status`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            status: "in_progress",
          }),
        },
      );

      if (!response.ok) {
        setError(await apiError(response, "Unable to update match."));
        return;
      }

      await onUpdated();
    } catch {
      setError("Unable to update match.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div
      className="border-t border-slate-200 bg-slate-50 px-3 py-2"
      data-testid="match-controls"
    >
      {match.status === "ready" ? (
        <button
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={courtsFull || isUpdating}
          onClick={() => void markInProgress()}
          title={courtsFull ? "All courts occupied" : undefined}
          type="button"
        >
          {isUpdating ? "Updating..." : "Mark as in progress"}
        </button>
      ) : (
        <button
          className="w-full rounded-md bg-amber-600 px-3 py-2 text-xs font-semibold text-white"
          onClick={() => setShowScores(true)}
          type="button"
        >
          Enter scores
        </button>
      )}
      {error ? (
        <p className="mt-2 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {showScores ? (
        <ScoreEntry
          match={match}
          onClose={() => setShowScores(false)}
          onUpdated={onUpdated}
          teamAName={teamAName}
          teamBName={teamBName}
          tournamentId={tournamentId}
        />
      ) : null}
    </div>
  );
}
