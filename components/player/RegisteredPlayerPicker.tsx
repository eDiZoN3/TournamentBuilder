"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/ui/LocaleProvider";

export interface RegisteredPlayerOption {
  _id: string;
  firstName?: string;
  surname?: string;
  displayName: string;
}

interface RegisteredPlayerPickerProps {
  clearOnSelect?: boolean;
  labelKey?: "findRegisteredPlayer" | "opponentName";
  onSelect: (player: RegisteredPlayerOption) => void;
  selectedPlayerIds?: string[];
}

export function RegisteredPlayerPicker({
  clearOnSelect = true,
  labelKey = "findRegisteredPlayer",
  onSelect,
  selectedPlayerIds = [],
}: RegisteredPlayerPickerProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<RegisteredPlayerOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedIds = useMemo(
    () => new Set(selectedPlayerIds),
    [selectedPlayerIds],
  );
  const visiblePlayers = players.filter((player) => !selectedIds.has(player._id));

  useEffect(() => {
    const trimmedQuery = query.trim();
    let isCurrent = true;

    if (!trimmedQuery) {
      setPlayers([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`/api/player-profiles?q=${encodeURIComponent(trimmedQuery)}`, {
      method: "GET",
    })
      .then(async (response) => {
        const body = await response.json();

        if (!isCurrent) {
          return;
        }

        if (!response.ok) {
          setError(body.error ?? t("unableToRefresh"));
          setPlayers([]);
          return;
        }

        setPlayers((body.players ?? []) as RegisteredPlayerOption[]);
      })
      .catch(() => {
        if (isCurrent) {
          setError(t("unableToRefresh"));
          setPlayers([]);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [query, t]);

  function selectPlayer(player: RegisteredPlayerOption) {
    onSelect(player);

    if (clearOnSelect) {
      setQuery("");
      setPlayers([]);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        <span>{t(labelKey)}</span>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          onChange={(event) => setQuery(event.target.value)}
          value={query}
        />
      </label>
      {isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("loading")}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {query.trim() && !isLoading && players.length > 0 && visiblePlayers.length === 0 ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          {t("playerAlreadySelected")}
        </p>
      ) : null}
      {query.trim() && !isLoading && players.length === 0 && !error ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("noRegisteredPlayersFound")}
        </p>
      ) : null}
      {visiblePlayers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {visiblePlayers.map((player) => (
            <button
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              key={player._id}
              onClick={() => selectPlayer(player)}
              type="button"
            >
              {player.displayName}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
