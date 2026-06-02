"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { ITournament } from "@/lib/models/Tournament";

interface TournamentDeleteTarget {
  _id: string | { toString(): string };
  name: string;
  status: ITournament["status"];
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
  const [confirmationName, setConfirmationName] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const tournamentId = tournament._id.toString();
  const requiresTypedConfirmation = tournament.status !== "draft";
  const confirmationMatches = confirmationName === tournament.name;

  async function confirmDelete() {
    if (!isConfirming) {
      setConfirmationName("");
      setIsConfirming(true);
      return;
    }

    if (requiresTypedConfirmation && !confirmationMatches) {
      showToast({
        message: `Type ${tournament.name} to confirm deletion.`,
        title: "Delete confirmation required",
        type: "error",
      });
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
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
        const message = await apiError(response, "Unable to delete tournament.");

        showToast({
          message,
          title: "Delete failed",
          type: "error",
        });
        return;
      }

      await onDeleted();
      setIsConfirming(false);
      setConfirmationName("");
      showToast({
        message: `${tournament.name} was deleted.`,
        title: "Tournament deleted",
        type: "success",
      });
    } catch {
      showToast({
        message: "Unable to delete tournament.",
        title: "Delete failed",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isConfirming) {
    return (
      <button
        aria-label={`Delete ${tournament.name}`}
        className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700"
        onClick={() => void confirmDelete()}
        type="button"
      >
        Delete
      </button>
    );
  }

  if (!requiresTypedConfirmation) {
    return (
      <button
        aria-label={`Confirm Delete ${tournament.name}`}
        className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
        disabled={isDeleting}
        onClick={() => void confirmDelete()}
        type="button"
      >
        {isDeleting ? "Deleting..." : "Confirm Delete"}
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
      <p className="font-medium">Type {tournament.name} to confirm deletion.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          aria-label={`Type ${tournament.name} to confirm deletion`}
          className="min-w-0 flex-1 rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-slate-900"
          onChange={(event) => setConfirmationName(event.target.value)}
          value={confirmationName}
        />
        <button
          aria-label={`Confirm Delete ${tournament.name}`}
          className="rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!confirmationMatches || isDeleting}
          onClick={() => void confirmDelete()}
          type="button"
        >
          {isDeleting ? "Deleting..." : "Confirm Delete"}
        </button>
        <button
          className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700"
          disabled={isDeleting}
          onClick={() => setIsConfirming(false)}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
