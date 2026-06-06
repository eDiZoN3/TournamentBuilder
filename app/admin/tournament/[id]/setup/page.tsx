"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "@/components/ui/LocaleProvider";
import {
  getApiErrorMessage,
  TournamentSetupForm,
  type SetupTournament,
} from "@/components/admin/TournamentSetupForm";

const JOINED_PLAYERS_REFRESH_INTERVAL_MS = 750;

export default function TournamentSetupPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLocale();
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
              await getApiErrorMessage(response, t("unableToLoadTournament")),
            );
          }
          return;
        }

        if (isActive) {
          setTournament((await response.json()) as SetupTournament);
        }
      } catch {
        if (isActive) {
          setError(t("unableToLoadTournament"));
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
  }, [params.id, t]);

  if (error) {
    return <p className="text-sm font-medium text-red-600">{error}</p>;
  }

  if (!tournament) {
    return <p className="text-slate-600 dark:text-slate-300">{t("loadingTournament")}</p>;
  }

  return <TournamentSetupForm tournament={tournament} />;
}
