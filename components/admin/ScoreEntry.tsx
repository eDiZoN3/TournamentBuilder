"use client";

import { useState } from "react";
import { useLocale } from "@/components/ui/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { formatTranslation } from "@/lib/i18n";
import type { IMatch, ISetScore } from "@/lib/models/Tournament";
import {
  determineMatchWinner,
  replaceSet,
  validateSet,
  type TeamSide,
} from "@/lib/scoring";

interface ScoreEntryProps {
  match: IMatch;
  mode?: "entry" | "override";
  onClose: () => void;
  onUpdated: () => void | Promise<void>;
  teamAName: string;
  teamBName: string;
  tournamentId: string;
}

interface ScoreDraft {
  scoreA: string;
  scoreB: string;
}

interface ScoreResponse {
  sets: ISetScore[];
  matchWinner: TeamSide | null;
}

interface OverrideResponse {
  affectedMatchIds: string[];
  winnerChanged: boolean;
}

interface ApiError {
  error?: string;
}

function recordedSets(match: IMatch): ISetScore[] {
  return match.teamA?.sets.length
    ? match.teamA.sets
    : (match.teamB?.sets ?? []);
}

function draftsFor(sets: ISetScore[], count: number): ScoreDraft[] {
  return Array.from({ length: count }, (_, index) => ({
    scoreA: sets[index]?.scoreA.toString() ?? "",
    scoreB: sets[index]?.scoreB.toString() ?? "",
  }));
}

async function apiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ApiError;

    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function ScoreEntry({
  match,
  mode = "entry",
  onClose,
  onUpdated,
  teamAName,
  teamBName,
  tournamentId,
}: ScoreEntryProps) {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const isOverride = mode === "override";
  const setCount = match.format === "bo1" ? 1 : 3;
  const initialSets = recordedSets(match);
  const [sets, setSets] = useState<ISetScore[]>(initialSets);
  const [drafts, setDrafts] = useState<ScoreDraft[]>(
    draftsFor(initialSets, setCount),
  );
  const [matchWinner, setMatchWinner] = useState<TeamSide | null>(
    determineMatchWinner(initialSets, match.format),
  );
  const [error, setError] = useState<string | null>(null);
  const [savingSet, setSavingSet] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [requiresOverrideConfirmation, setRequiresOverrideConfirmation] =
    useState(false);
  const correctedWinnerId =
    matchWinner === "A"
      ? match.teamA?.teamId.toString()
      : matchWinner === "B"
        ? match.teamB?.teamId.toString()
        : null;
  const winnerChanged =
    isOverride &&
    Boolean(match.winnerId) &&
    Boolean(correctedWinnerId) &&
    match.winnerId?.toString() !== correctedWinnerId;

  function updateDraft(index: number, side: keyof ScoreDraft, value: string) {
    setDrafts((current) =>
      current.map((draft, currentIndex) =>
        currentIndex === index
          ? {
              ...draft,
              [side]: value,
            }
          : draft,
      ),
    );
  }

  async function saveSet(index: number) {
    const scoreA = Number(drafts[index].scoreA);
    const scoreB = Number(drafts[index].scoreB);
    const validation = validateSet(scoreA, scoreB);

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError(null);

    if (isOverride) {
      const replacement = replaceSet(sets, index, {
        scoreA,
        scoreB,
        pointsToWin: validation.pointsToWin,
      });

      setSets(replacement.sets);
      setDrafts(draftsFor(replacement.sets, setCount));
      setMatchWinner(determineMatchWinner(replacement.sets, match.format));
      setRequiresOverrideConfirmation(false);
      return;
    }

    setSavingSet(index);

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match._id.toString()}/scores`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            setIndex: index,
            scoreA,
            scoreB,
          }),
        },
      );

      if (!response.ok) {
        const message = await apiError(response, t("unableToSaveScore"));

        showToast({
          message,
          title: t("unableToSaveScore"),
          type: "error",
        });
        return;
      }

      const result = (await response.json()) as ScoreResponse;

      setSets(result.sets);
      setDrafts(draftsFor(result.sets, setCount));
      setMatchWinner(result.matchWinner);
      await onUpdated();
      showToast({
        message: formatTranslation(locale, "setSaved", { set: index + 1 }),
        title: t("scoreSaved"),
        type: "success",
      });
    } catch {
      const message = t("unableToSaveScore");

      showToast({
        message,
        title: t("unableToSaveScore"),
        type: "error",
      });
    } finally {
      setSavingSet(null);
    }
  }

  async function submitOverride() {
    if (!matchWinner) {
      setError(t("matchWinnerNotDetermined"));
      return;
    }

    if (winnerChanged && !requiresOverrideConfirmation) {
      setRequiresOverrideConfirmation(true);
      return;
    }

    setError(null);
    setIsConfirming(true);

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match._id.toString()}/override`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sets,
          }),
        },
      );

      if (!response.ok) {
        const message = await apiError(response, t("unableToOverrideMatch"));

        showToast({
          message,
          title: t("unableToOverrideMatch"),
          type: "error",
        });
        return;
      }

      const result = (await response.json()) as OverrideResponse;
      const resetMessage =
        result.winnerChanged && result.affectedMatchIds.length > 0
          ? formatTranslation(locale, "resultUpdatedWithDownstreamReset", {
              count: result.affectedMatchIds.length,
            })
          : t("resultUpdated");

      await onUpdated();
      showToast({
        message: resetMessage,
        title: t("matchOverridden"),
        type: "success",
      });
      onClose();
    } catch {
      showToast({
        message: t("unableToOverrideMatch"),
        title: t("unableToOverrideMatch"),
        type: "error",
      });
    } finally {
      setIsConfirming(false);
    }
  }

  async function confirmMatch() {
    setError(null);
    setIsConfirming(true);

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
      onClose();
    } catch {
      const message = t("unableToConfirmMatch");

      showToast({
        message,
        title: t("unableToConfirmMatch"),
        type: "error",
      });
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div
      aria-labelledby="score-entry-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 dark:bg-black/60"
      role="dialog"
    >
      <section className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold" id="score-entry-title">
              {isOverride ? t("overrideResult") : t("enterScores")}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {match.label} / {match.format === "bo1" ? t("bestOfOne") : t("bestOfThree")}
            </p>
          </div>
          <button
            className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-600"
            onClick={onClose}
            type="button"
          >
            {t("close")}
          </button>
        </header>
        <div className="mt-5 space-y-4">
          {drafts.map((draft, index) => {
            const isLocked = index > sets.length;

            return (
              <fieldset
                className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                disabled={isLocked}
                key={index}
              >
                <legend className="px-1 text-sm font-semibold">
                  {t("set")} {index + 1}
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    <span className="mb-1 block text-slate-600 dark:text-slate-300">{teamAName}</span>
                    <input
                      aria-label={`${t("set")} ${index + 1} ${t("team")} A`}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
                      disabled={isLocked}
                      min="0"
                      onChange={(event) =>
                        updateDraft(index, "scoreA", event.target.value)
                      }
                      type="number"
                      value={draft.scoreA}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-slate-600 dark:text-slate-300">{teamBName}</span>
                    <input
                      aria-label={`${t("set")} ${index + 1} ${t("team")} B`}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
                      disabled={isLocked}
                      min="0"
                      onChange={(event) =>
                        updateDraft(index, "scoreB", event.target.value)
                      }
                      type="number"
                      value={draft.scoreB}
                    />
                  </label>
                </div>
                <button
                  className="mt-3 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  disabled={isLocked || savingSet === index}
                  onClick={() => void saveSet(index)}
                  type="button"
                >
                  {savingSet === index ? t("saving") : `${t("saveSet")} ${index + 1}`}
                </button>
              </fieldset>
            );
          })}
        </div>
        {error ? (
          <p className="mt-4 text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {matchWinner ? (
          <>
            {requiresOverrideConfirmation ? (
              <p
                className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
                role="alert"
              >
                {t("changingWinnerWarning")}
              </p>
            ) : null}
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-700">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {t("winner")}: {matchWinner === "A" ? teamAName : teamBName}
              </p>
              <button
                className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={isConfirming}
                onClick={() =>
                  void (isOverride ? submitOverride() : confirmMatch())
                }
                type="button"
              >
                {isConfirming
                  ? isOverride
                    ? t("submitting")
                    : t("confirming")
                  : isOverride
                    ? requiresOverrideConfirmation
                      ? t("confirmOverride")
                      : t("submitOverride")
                    : t("confirmMatch")}
              </button>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
