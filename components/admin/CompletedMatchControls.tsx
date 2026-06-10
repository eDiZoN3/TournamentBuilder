"use client";

import { useEffect, useRef, useState } from "react";
import { ScoreEntry } from "@/components/admin/ScoreEntry";
import { useLocale } from "@/components/ui/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { formatTranslation } from "@/lib/i18n";
import type { IMatch, MatchResultMode } from "@/lib/models/Tournament";

interface CompletedMatchControlsProps {
  match: IMatch;
  matchResultMode?: MatchResultMode;
  onScoreEntryClose?: () => void;
  onScoreEntryOpen?: (matchId: string) => void;
  onUpdated: () => void | Promise<void>;
  teamAName: string;
  teamBName: string;
  tournamentId: string;
}

export function CompletedMatchControls({
  match,
  matchResultMode = "points",
  onScoreEntryClose,
  onScoreEntryOpen,
  onUpdated,
  teamAName,
  teamBName,
  tournamentId,
}: CompletedMatchControlsProps) {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const [showOverride, setShowOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  if (match.isBye || match.status !== "completed") {
    return null;
  }

  function openOverride() {
    scoreEntryOpenRef.current = true;
    setShowOverride(true);
    onScoreEntryOpen?.(matchId);
  }

  function closeOverride() {
    setShowOverride(false);

    if (scoreEntryOpenRef.current) {
      scoreEntryOpenRef.current = false;
      onScoreEntryClose?.();
    }
  }

  async function submitWinnerOverride(winnerSide: "A" | "B") {
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match._id.toString()}/override`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ winnerSide }),
        },
      );

      if (!response.ok) {
        showToast({
          message: t("unableToOverrideMatch"),
          title: t("unableToOverrideMatch"),
          type: "error",
        });
        return;
      }

      await onUpdated();
      showToast({
        message: t("resultUpdated"),
        title: t("matchOverridden"),
        type: "success",
      });
      closeOverride();
    } catch {
      showToast({
        message: t("unableToOverrideMatch"),
        title: t("unableToOverrideMatch"),
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="border-t border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
      data-testid="completed-match-controls"
    >
      <button
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
        onClick={openOverride}
        type="button"
      >
        {t("overrideResult")}
      </button>
      {showOverride ? (
        matchResultMode === "winner_only" ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([
              ["A", teamAName],
              ["B", teamBName],
            ] as const).map(([side, teamName]) => (
              <button
                className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                disabled={isSubmitting}
                key={side}
                onClick={() => void submitWinnerOverride(side)}
                type="button"
              >
                {formatTranslation(locale, "teamWon", { team: teamName })}
              </button>
            ))}
          </div>
        ) : (
          <ScoreEntry
            match={match}
            mode="override"
            onClose={closeOverride}
            onUpdated={onUpdated}
            teamAName={teamAName}
            teamBName={teamBName}
            tournamentId={tournamentId}
          />
        )
      ) : null}
    </div>
  );
}
