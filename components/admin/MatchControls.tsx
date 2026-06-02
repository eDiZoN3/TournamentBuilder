"use client";

import { useEffect, useRef, useState } from "react";
import { CourtOverrideControls } from "@/components/admin/CourtOverrideControls";
import { ScoreEntry } from "@/components/admin/ScoreEntry";
import { useToast } from "@/components/ui/Toast";
import type { IMatch } from "@/lib/models/Tournament";

interface MatchControlsProps {
  courtsAvailable: number;
  currentMatchIds: Array<string | { toString(): string }>;
  match: IMatch;
  onScoreEntryClose?: () => void;
  onScoreEntryOpen?: (matchId: string) => void;
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
  onScoreEntryClose,
  onScoreEntryOpen,
  onUpdated,
  teamAName,
  teamBName,
  tournamentId,
}: MatchControlsProps) {
  const { showToast } = useToast();
  const [showScores, setShowScores] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const scoreEntryOpenRef = useRef(false);
  const onScoreEntryCloseRef = useRef(onScoreEntryClose);
  const matchId = match._id.toString();

  useEffect(() => {
    onScoreEntryCloseRef.current = onScoreEntryClose;
  }, [onScoreEntryClose]);

  useEffect(
    () => () => {
      if (scoreEntryOpenRef.current) {
        scoreEntryOpenRef.current = false;
        onScoreEntryCloseRef.current?.();
      }
    },
    [],
  );

  if (
    match.isBye ||
    (match.status !== "ready" && match.status !== "in_progress")
  ) {
    return null;
  }

  const courtsFull = currentMatchIds.length >= courtsAvailable;

  function openScoreEntry() {
    scoreEntryOpenRef.current = true;
    setShowScores(true);
    onScoreEntryOpen?.(matchId);
  }

  function closeScoreEntry() {
    setShowScores(false);

    if (scoreEntryOpenRef.current) {
      scoreEntryOpenRef.current = false;
      onScoreEntryClose?.();
    }
  }

  async function markInProgress() {
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
        const message = await apiError(response, "Unable to update match.");

        showToast({
          message,
          title: "Unable to update match",
          type: "error",
        });
        return;
      }

      await onUpdated();
      showToast({
        message: `${match.label} is now in progress.`,
        title: "Match updated",
        type: "success",
      });
    } catch {
      const message = "Unable to update match.";

      showToast({
        message,
        title: "Unable to update match",
        type: "error",
      });
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
          onClick={openScoreEntry}
          type="button"
        >
          Enter scores
        </button>
      )}
      <CourtOverrideControls
        courtsAvailable={courtsAvailable}
        match={match}
        onUpdated={onUpdated}
        tournamentId={tournamentId}
      />
      {showScores ? (
        <ScoreEntry
          match={match}
          onClose={closeScoreEntry}
          onUpdated={onUpdated}
          teamAName={teamAName}
          teamBName={teamBName}
          tournamentId={tournamentId}
        />
      ) : null}
    </div>
  );
}
