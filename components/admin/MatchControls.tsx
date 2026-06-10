"use client";

import { useEffect, useRef, useState } from "react";
import { CompletedMatchControls } from "@/components/admin/CompletedMatchControls";
import { CourtOverrideControls } from "@/components/admin/CourtOverrideControls";
import { ScoreEntry } from "@/components/admin/ScoreEntry";
import { useLocale } from "@/components/ui/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { formatTranslation } from "@/lib/i18n";
import type { IMatch, MatchResultMode } from "@/lib/models/Tournament";

interface MatchControlsProps {
  courtsAvailable: number;
  currentMatchIds: Array<string | { toString(): string }>;
  match: IMatch;
  matchResultMode?: MatchResultMode;
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
  matchResultMode = "points",
  onScoreEntryClose,
  onScoreEntryOpen,
  onUpdated,
  teamAName,
  teamBName,
  tournamentId,
}: MatchControlsProps) {
  const { locale, t } = useLocale();
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

  if (match.status === "completed" && !match.isBye) {
    return (
      <CompletedMatchControls
        match={match}
        matchResultMode={matchResultMode}
        onScoreEntryClose={onScoreEntryClose}
        onScoreEntryOpen={onScoreEntryOpen}
        onUpdated={onUpdated}
        teamAName={teamAName}
        teamBName={teamBName}
        tournamentId={tournamentId}
      />
    );
  }

  if (
    match.isBye ||
    (match.status !== "ready" && match.status !== "in_progress")
  ) {
    return null;
  }

  const courtsFull =
    matchResultMode !== "winner_only" &&
    currentMatchIds.length >= courtsAvailable;

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
        const message = await apiError(response, t("unableToUpdateMatch"));

        showToast({
          message,
          title: t("unableToUpdateMatch"),
          type: "error",
        });
        return;
      }

      await onUpdated();
      showToast({
        message: formatTranslation(locale, "matchInProgress", {
          match: match.label,
        }),
        title: t("matchUpdated"),
        type: "success",
      });
    } catch {
      const message = t("unableToUpdateMatch");

      showToast({
        message,
        title: t("unableToUpdateMatch"),
        type: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function completeWinnerOnly(winnerSide: "A" | "B") {
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
            status: "completed",
            winnerSide,
          }),
        },
      );

      if (!response.ok) {
        const message = await apiError(response, t("unableToConfirmMatch"));

        showToast({
          message,
          title: t("unableToConfirmMatch"),
          type: "error",
        });
        return;
      }

      await onUpdated();
      showToast({
        message: formatTranslation(locale, "matchCompleted", {
          match: match.label,
        }),
        title: t("matchConfirmed"),
        type: "success",
      });
    } catch {
      showToast({
        message: t("unableToConfirmMatch"),
        title: t("unableToConfirmMatch"),
        type: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div
      className="border-t border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
      data-testid="match-controls"
    >
      {match.status === "ready" ? (
        <button
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={courtsFull || isUpdating}
          onClick={() => void markInProgress()}
          title={courtsFull ? t("allCourtsOccupied") : undefined}
          type="button"
        >
          {isUpdating ? t("updating") : t("markAsInProgress")}
        </button>
      ) : matchResultMode === "winner_only" ? (
        <div className="grid grid-cols-2 gap-2">
          {([
            ["A", teamAName],
            ["B", teamBName],
          ] as const).map(([side, teamName]) => (
            <button
              className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              disabled={isUpdating}
              key={side}
              onClick={() => void completeWinnerOnly(side)}
              type="button"
            >
              {formatTranslation(locale, "teamWon", { team: teamName })}
            </button>
          ))}
        </div>
      ) : (
        <button
          className="w-full rounded-md bg-amber-600 px-3 py-2 text-xs font-semibold text-white"
          onClick={openScoreEntry}
          type="button"
        >
          {t("enterScores")}
        </button>
      )}
      {courtsAvailable > 1 ? (
        <CourtOverrideControls
          courtsAvailable={courtsAvailable}
          match={match}
          onUpdated={onUpdated}
          tournamentId={tournamentId}
        />
      ) : null}
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
