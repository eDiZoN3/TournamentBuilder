"use client";

import { useEffect, useRef, useState } from "react";
import { ScoreEntry } from "@/components/admin/ScoreEntry";
import type { IMatch } from "@/lib/models/Tournament";

interface CompletedMatchControlsProps {
  match: IMatch;
  onScoreEntryClose?: () => void;
  onScoreEntryOpen?: (matchId: string) => void;
  onUpdated: () => void | Promise<void>;
  teamAName: string;
  teamBName: string;
  tournamentId: string;
}

export function CompletedMatchControls({
  match,
  onScoreEntryClose,
  onScoreEntryOpen,
  onUpdated,
  teamAName,
  teamBName,
  tournamentId,
}: CompletedMatchControlsProps) {
  const [showOverride, setShowOverride] = useState(false);
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
        Override result
      </button>
      {showOverride ? (
        <ScoreEntry
          match={match}
          mode="override"
          onClose={closeOverride}
          onUpdated={onUpdated}
          teamAName={teamAName}
          teamBName={teamBName}
          tournamentId={tournamentId}
        />
      ) : null}
    </div>
  );
}
