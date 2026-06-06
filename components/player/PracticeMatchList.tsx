"use client";

import { useState } from "react";
import { useLocale } from "@/components/ui/LocaleProvider";
import type { SerializedPracticeMatch } from "@/lib/practiceMatches";

interface PracticeMatchListProps {
  currentPlayerProfileId: string;
  matches: SerializedPracticeMatch[];
  onDeleted: (id: string) => void;
  onEdit: (match: SerializedPracticeMatch) => void;
}

function sideNames(side: SerializedPracticeMatch["sideA"]): string {
  return side.map((participant) => participant.displayName).join(", ");
}

function scoreLabel(match: SerializedPracticeMatch): string {
  return match.sets
    .map((set) => `${set.scoreA}:${set.scoreB}`)
    .join(", ");
}

export function PracticeMatchList({
  currentPlayerProfileId,
  matches,
  onDeleted,
  onEdit,
}: PracticeMatchListProps) {
  const { t } = useLocale();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteMatch(match: SerializedPracticeMatch) {
    setError(null);
    setDeletingId(match._id);

    try {
      const response = await fetch(`/api/practice-matches/${match._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(t("unableToDeletePracticeMatch"));
        return;
      }

      onDeleted(match._id);
    } catch {
      setError(t("unableToDeletePracticeMatch"));
    } finally {
      setDeletingId(null);
    }
  }

  if (matches.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {t("noPracticeMatches")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
        {matches.map((match) => {
          const canManage = match.createdBy === currentPlayerProfileId;

          return (
            <li
              className="flex flex-wrap items-center justify-between gap-3 p-4"
              key={match._id}
            >
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {sideNames(match.sideA)} {t("versus")} {sideNames(match.sideB)}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {scoreLabel(match)}
                </p>
              </div>
              {canManage ? (
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => onEdit(match)}
                    type="button"
                  >
                    {t("edit")}
                  </button>
                  <button
                    className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                    disabled={deletingId === match._id}
                    onClick={() => void deleteMatch(match)}
                    type="button"
                  >
                    {t("delete")}
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
