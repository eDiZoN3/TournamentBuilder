"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/ui/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { formatTranslation } from "@/lib/i18n";
import type { IMatch } from "@/lib/models/Tournament";

interface CourtOverrideControlsProps {
  courtsAvailable: number;
  match: IMatch;
  onUpdated: () => void | Promise<void>;
  tournamentId: string;
}

interface CourtResponse {
  courtNumber: number;
  replacedMatchId: string | null;
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

export function CourtOverrideControls({
  courtsAvailable,
  match,
  onUpdated,
  tournamentId,
}: CourtOverrideControlsProps) {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const [courtNumber, setCourtNumber] = useState(match.courtNumber ?? 1);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    setCourtNumber(match.courtNumber ?? 1);
  }, [match._id, match.courtNumber]);

  if (
    courtsAvailable <= 1 ||
    match.isBye ||
    (match.status !== "ready" && match.status !== "in_progress")
  ) {
    return null;
  }

  async function assignSelectedCourt() {
    setIsAssigning(true);

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match._id.toString()}/court`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ courtNumber }),
        },
      );

      if (!response.ok) {
        const message = await apiError(response, t("unableToAssignCourt"));

        showToast({
          message,
          title: t("courtOverrideFailed"),
          type: "error",
        });
        return;
      }

      const result = (await response.json()) as CourtResponse;
      const message = result.replacedMatchId
        ? formatTranslation(locale, "courtAssignedWithReplacement", {
            court: result.courtNumber,
          })
        : formatTranslation(locale, "courtAssignedMessage", {
            court: result.courtNumber,
          });

      await onUpdated();
      showToast({
        message,
        title: t("courtAssigned"),
        type: "success",
      });
    } catch {
      showToast({
        message: t("unableToAssignCourt"),
        title: t("courtOverrideFailed"),
        type: "error",
      });
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <div className="mt-2 flex gap-2" data-testid="court-override">
      <label className="flex-1 text-xs font-medium text-slate-600 dark:text-slate-300">
        <span className="sr-only">{t("courtOverride")}</span>
        <select
          aria-label={t("courtOverride")}
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 dark:border-slate-600 dark:bg-slate-900"
          onChange={(event) => setCourtNumber(Number(event.target.value))}
          value={courtNumber}
        >
          {Array.from({ length: courtsAvailable }, (_, index) => index + 1).map(
            (candidate) => (
              <option key={candidate} value={candidate}>
                {t("court")} {candidate}
              </option>
            ),
          )}
        </select>
      </label>
      <button
        className="rounded-md border border-slate-300 px-2 py-2 text-xs font-semibold dark:border-slate-600 dark:text-slate-200"
        disabled={isAssigning}
        onClick={() => void assignSelectedCourt()}
        type="button"
      >
        {isAssigning ? t("assigning") : t("assignCourt")}
      </button>
    </div>
  );
}
