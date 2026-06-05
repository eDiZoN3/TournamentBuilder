"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getApiErrorMessage,
  TournamentSetupForm,
  type SetupTournament,
} from "@/components/admin/TournamentSetupForm";

const JOINED_PLAYERS_REFRESH_INTERVAL_MS = 750;

export default function TournamentSetupPage() {
  const params = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<SetupTournament | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadTournament() {
      try {
        const response = await fetch(`/api/tournaments/${params.id}`);

        if (!response.ok) {
          if (isActive) {
            setError(
              await getApiErrorMessage(response, "Unable to load tournament."),
            );
          }
          return;
        }

        if (isActive) {
          setTournament((await response.json()) as SetupTournament);
        }
      } catch {
        if (isActive) {
          setError("Unable to load tournament.");
        }
      }
    }

    void loadTournament();

    const refreshInterval = window.setInterval(() => {
      void loadTournament();
    }, JOINED_PLAYERS_REFRESH_INTERVAL_MS);

    return () => {
      isActive = false;
      window.clearInterval(refreshInterval);
    };
  }, [params.id]);

  if (error) {
    return <p className="text-sm font-medium text-red-600">{error}</p>;
  }

  if (!tournament) {
    return <p className="text-slate-600 dark:text-slate-300">Loading tournament...</p>;
  }

  return <TournamentSetupForm tournament={tournament} />;
}
