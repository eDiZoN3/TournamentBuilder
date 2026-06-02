"use client";

import { useState } from "react";
import type { IMatch, ISetScore } from "@/lib/models/Tournament";
import { determineMatchWinner, validateSet, type TeamSide } from "@/lib/scoring";

interface ScoreEntryProps {
  match: IMatch;
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
  onClose,
  onUpdated,
  teamAName,
  teamBName,
  tournamentId,
}: ScoreEntryProps) {
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
        setError(await apiError(response, "Unable to save score."));
        return;
      }

      const result = (await response.json()) as ScoreResponse;

      setSets(result.sets);
      setDrafts(draftsFor(result.sets, setCount));
      setMatchWinner(result.matchWinner);
      await onUpdated();
    } catch {
      setError("Unable to save score.");
    } finally {
      setSavingSet(null);
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
        setError(await apiError(response, "Unable to confirm match."));
        return;
      }

      await onUpdated();
      onClose();
    } catch {
      setError("Unable to confirm match.");
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div
      aria-labelledby="score-entry-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
    >
      <section className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold" id="score-entry-title">
              Enter scores
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {match.label} / {match.format === "bo1" ? "Best of 1" : "Best of 3"}
            </p>
          </div>
          <button
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </header>
        <div className="mt-5 space-y-4">
          {drafts.map((draft, index) => {
            const isLocked = index > sets.length;

            return (
              <fieldset
                className="rounded-lg border border-slate-200 p-3"
                disabled={isLocked}
                key={index}
              >
                <legend className="px-1 text-sm font-semibold">
                  Set {index + 1}
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    <span className="mb-1 block text-slate-600">{teamAName}</span>
                    <input
                      aria-label={`Set ${index + 1} Team A`}
                      className="w-full rounded-md border border-slate-300 px-3 py-2"
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
                    <span className="mb-1 block text-slate-600">{teamBName}</span>
                    <input
                      aria-label={`Set ${index + 1} Team B`}
                      className="w-full rounded-md border border-slate-300 px-3 py-2"
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
                  {savingSet === index ? "Saving..." : `Save set ${index + 1}`}
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
          <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <p className="text-sm font-semibold text-emerald-700">
              Winner: {matchWinner === "A" ? teamAName : teamBName}
            </p>
            <button
              className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={isConfirming}
              onClick={() => void confirmMatch()}
              type="button"
            >
              {isConfirming ? "Confirming..." : "Confirm match"}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
