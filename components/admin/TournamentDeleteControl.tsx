"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useLocale } from "@/components/ui/LocaleProvider";
import { translate } from "@/lib/i18n";

interface TournamentDeleteTarget {
  _id: string | { toString(): string };
  name: string;
  status: "draft" | "active" | "completed";
}

interface TournamentDeleteControlProps {
  onDeleted: () => void | Promise<void>;
  tournament: TournamentDeleteTarget;
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

export function TournamentDeleteControl({
  onDeleted,
  tournament,
}: TournamentDeleteControlProps) {
  const { showToast } = useToast();
  const { locale } = useLocale();
  const [confirmationName, setConfirmationName] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const tournamentId = tournament._id.toString();
  const endpoint = `/api/tournaments/${tournamentId}`;
  const requiresTypedConfirmation = tournament.status !== "draft";
  const confirmationMatches = confirmationName === tournament.name;
  const typedConfirmationMessage = translate(locale, 'deleteIncorrectName').replace('{name}', tournament.name);
  const typedConfirmationLabel = typedConfirmationMessage.replace(/\.$/, "");

  async function confirmDelete() {
    if (!isConfirming) {
      setConfirmationName("");
      setIsConfirming(true);
      return;
    }

    if (requiresTypedConfirmation && !confirmationMatches) {
      showToast({
        message: typedConfirmationMessage,
        title: translate(locale, 'deleteConfirmationRequired'),
        type: "error",
      });
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        ...(requiresTypedConfirmation
          ? {
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({
                confirmationName,
              }),
            }
          : {}),
      });

      if (!response.ok) {
        const message = await apiError(
          response,
          translate(locale, "unableToDeleteTournament"),
        );

        showToast({
          message,
          title: translate(locale, 'deleteFailed'),
          type: "error",
        });
        return;
      }

      await onDeleted();
      setIsConfirming(false);
      setConfirmationName("");
      showToast({
        message: `${tournament.name} ${translate(locale, "tournamentDeleted")}.`,
        title: translate(locale, "tournamentDeleted"),
        type: "success",
      });
    } catch {
      showToast({
        message: translate(locale, "unableToDeleteTournament"),
        title: translate(locale, 'deleteFailed'),
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isConfirming) {
    return (
      <button
        aria-label={`${translate(locale, 'delete')} ${tournament.name}`}
        className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-700 dark:text-red-300"
        onClick={() => void confirmDelete()}
        type="button"
      >
        {translate(locale, 'delete')}
      </button>
    );
  }

  if (!requiresTypedConfirmation) {
    return (
      <button
        aria-label={`${translate(locale, 'confirmDeleteButton')} ${tournament.name}`}
        className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50 dark:border-red-700 dark:bg-red-950 dark:text-red-200"
        disabled={isDeleting}
        onClick={() => void confirmDelete()}
        type="button"
      >
        {isDeleting ? translate(locale, 'saving') : translate(locale, 'confirmDeleteButton')}
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
      <p className="font-medium">{typedConfirmationMessage}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          aria-label={typedConfirmationLabel}
          className="min-w-0 flex-1 rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-red-700 dark:bg-slate-950 dark:text-white"
          onChange={(event) => setConfirmationName(event.target.value)}
          value={confirmationName}
        />
        <button
          aria-label={`${translate(locale, 'confirmDeleteButton')} ${tournament.name}`}
          className="rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!confirmationMatches || isDeleting}
          onClick={() => void confirmDelete()}
          type="button"
        >
          {isDeleting ? translate(locale, 'saving') : translate(locale, 'confirmDeleteButton')}
        </button>
        <button
          className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-700 dark:text-red-300"
          disabled={isDeleting}
          onClick={() => setIsConfirming(false)}
          type="button"
        >
          {translate(locale, 'cancel')}
        </button>
      </div>
    </div>
  );
}
