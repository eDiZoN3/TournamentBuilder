"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocale } from "@/components/ui/LocaleProvider";
import type { SerializedPracticeMatch } from "@/lib/practiceMatches";
import { validateSet } from "@/lib/scoring";

interface CurrentPracticePlayer {
  playerProfileId: string;
  displayName: string;
}

interface PracticeMatchFormProps {
  currentPlayer: CurrentPracticePlayer;
  editingMatch?: SerializedPracticeMatch | null;
  onCancelEdit?: () => void;
  onSaved: (match: SerializedPracticeMatch) => void;
}

function opponentNameFor(
  match: SerializedPracticeMatch | null | undefined,
  currentPlayerProfileId: string,
): string {
  if (!match) {
    return "";
  }

  const currentIsSideA = match.sideA.some(
    (participant) => participant.playerProfileId === currentPlayerProfileId,
  );
  const opponentSide = currentIsSideA ? match.sideB : match.sideA;

  return opponentSide.map((participant) => participant.displayName).join(", ");
}

function scoreValuesFor(
  match: SerializedPracticeMatch | null | undefined,
  currentPlayerProfileId: string,
) {
  if (!match || match.sets.length === 0) {
    return {
      currentScore: "",
      opponentScore: "",
    };
  }

  const currentIsSideA = match.sideA.some(
    (participant) => participant.playerProfileId === currentPlayerProfileId,
  );
  const set = match.sets[0];

  return {
    currentScore: String(currentIsSideA ? set.scoreA : set.scoreB),
    opponentScore: String(currentIsSideA ? set.scoreB : set.scoreA),
  };
}

export function PracticeMatchForm({
  currentPlayer,
  editingMatch = null,
  onCancelEdit,
  onSaved,
}: PracticeMatchFormProps) {
  const { t } = useLocale();
  const initialScores = useMemo(
    () => scoreValuesFor(editingMatch, currentPlayer.playerProfileId),
    [currentPlayer.playerProfileId, editingMatch],
  );
  const [opponentName, setOpponentName] = useState(() =>
    opponentNameFor(editingMatch, currentPlayer.playerProfileId),
  );
  const [currentScore, setCurrentScore] = useState(initialScores.currentScore);
  const [opponentScore, setOpponentScore] = useState(
    initialScores.opponentScore,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const scores = scoreValuesFor(editingMatch, currentPlayer.playerProfileId);

    setOpponentName(opponentNameFor(editingMatch, currentPlayer.playerProfileId));
    setCurrentScore(scores.currentScore);
    setOpponentScore(scores.opponentScore);
    setError(null);
  }, [currentPlayer.playerProfileId, editingMatch]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedOpponentName = opponentName.trim();
    const scoreA = Number(currentScore);
    const scoreB = Number(opponentScore);

    if (!trimmedOpponentName) {
      setError("Opponent name is required.");
      return;
    }

    const validation = validateSet(scoreA, scoreB);

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    const payload = {
      playedAt: editingMatch?.playedAt ?? new Date().toISOString(),
      sideA: [
        {
          playerProfileId: currentPlayer.playerProfileId,
          displayName: currentPlayer.displayName,
        },
      ],
      sideB: [
        {
          displayName: trimmedOpponentName,
        },
      ],
      sets: [
        {
          scoreA,
          scoreB,
        },
      ],
    };

    setIsSaving(true);

    try {
      const response = await fetch(
        editingMatch
          ? `/api/practice-matches/${editingMatch._id}`
          : "/api/practice-matches",
        {
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
          method: editingMatch ? "PUT" : "POST",
        },
      );
      const body = await response.json();

      if (!response.ok) {
        setError(body.error ?? "Unable to save practice match.");
        return;
      }

      onSaved(body.match as SerializedPracticeMatch);

      if (!editingMatch) {
        setOpponentName("");
        setCurrentScore("");
        setOpponentScore("");
      }
    } catch {
      setError("Unable to save practice match.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-[1fr_1fr_auto_auto]"
      onSubmit={handleSubmit}
    >
      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("player")}
        </span>
        <input
          className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          disabled
          value={currentPlayer.displayName}
        />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("opponentName")}
        </span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          onChange={(event) => setOpponentName(event.target.value)}
          value={opponentName}
        />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("yourScore")}
        </span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          min="0"
          onChange={(event) => setCurrentScore(event.target.value)}
          type="number"
          value={currentScore}
        />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("opponentScore")}
        </span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          min="0"
          onChange={(event) => setOpponentScore(event.target.value)}
          type="number"
          value={opponentScore}
        />
      </label>
      {error ? (
        <p className="text-sm font-medium text-red-600 md:col-span-4">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 md:col-span-4">
        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? t("saving") : t("savePracticeMatch")}
        </button>
        {editingMatch && onCancelEdit ? (
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={onCancelEdit}
            type="button"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
