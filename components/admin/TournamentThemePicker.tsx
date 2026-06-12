"use client";

import { useState } from "react";
import { useLocale } from "@/components/ui/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import {
  resolveTournamentTheme,
  TOURNAMENT_THEMES,
  type TournamentTheme,
} from "@/lib/tournamentTheme";

interface TournamentThemePickerProps {
  currentTheme: string;
  onUpdated: () => void | Promise<void>;
  tournamentId: string;
}

interface ApiError {
  error?: string;
}

async function apiErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ApiError;

    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function TournamentThemePicker({
  currentTheme,
  onUpdated,
  tournamentId,
}: TournamentThemePickerProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const selected = resolveTournamentTheme(currentTheme);

  async function changeTheme(nextTheme: TournamentTheme) {
    if (nextTheme === selected) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ theme: nextTheme }),
      });

      if (!response.ok) {
        const message = await apiErrorMessage(
          response,
          t("unableToUpdateTheme"),
        );

        showToast({ message, title: t("unableToUpdateTheme"), type: "error" });
        return;
      }

      await onUpdated();
      showToast({ title: t("themeUpdated"), type: "success" });
    } catch {
      showToast({
        message: t("unableToUpdateTheme"),
        title: t("unableToUpdateTheme"),
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
      <span className="uppercase tracking-wide">{t("appearance")}</span>
      <select
        aria-label={t("theme")}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        disabled={isSaving}
        onChange={(event) =>
          void changeTheme(event.target.value as TournamentTheme)
        }
        value={selected}
      >
        {TOURNAMENT_THEMES.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {t(theme.labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
}
