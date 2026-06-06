"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/ui/LocaleProvider";
import { formatTranslation } from "@/lib/i18n";

interface JoinTournamentButtonProps {
  currentPlayerName: string | null;
  initiallyJoined: boolean;
  tournamentId: string;
}

export function JoinTournamentButton({
  currentPlayerName,
  initiallyJoined,
  tournamentId,
}: JoinTournamentButtonProps) {
  const { locale, t } = useLocale();
  const [isJoined, setIsJoined] = useState(initiallyJoined);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentPlayerName) {
    return (
      <Link
        className="inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
        href="/signup"
      >
        {t("signUpToJoin")}
      </Link>
    );
  }

  if (isJoined) {
    return (
      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        {formatTranslation(locale, "joinedAs", { name: currentPlayerName })}
      </p>
    );
  }

  async function joinTournament() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: "POST",
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(body.error ?? t("unableToJoinTournament"));
        return;
      }

      setIsJoined(true);
    } catch {
      setError(t("unableToJoinTournament"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <button
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-950"
        disabled={isSubmitting}
        onClick={joinTournament}
        type="button"
      >
        {isSubmitting ? t("joining") : t("joinTournament")}
      </button>
      {error ? (
        <p className="mt-2 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
