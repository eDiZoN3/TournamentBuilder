"use client";

import { resolveTeamName } from "@/components/bracket/utils";
import { useLocale } from "@/components/ui/LocaleProvider";
import type { IMatch, ITeam } from "@/lib/models/Tournament";

interface UpNextBannerProps {
  matches: IMatch[];
  teams: ITeam[];
}

export function UpNextBanner({ matches, teams }: UpNextBannerProps) {
  const { t } = useLocale();
  const readyMatches = matches
    .filter((match) => match.status === "ready" && !match.isBye)
    .sort((first, second) => {
      if (first.bracket !== second.bracket) {
        return first.bracket === "winner" ? -1 : 1;
      }

      return first.round - second.round || first.position - second.position;
    })
    .slice(0, 3);

  if (readyMatches.length === 0) {
    return null;
  }

  return (
    <aside className="rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950">
      <h2 className="text-sm font-bold uppercase tracking-wide text-sky-900 dark:text-sky-100">
        {t("upNext")}
      </h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {readyMatches.map((match) => (
          <article
            className="rounded-lg border border-sky-100 bg-white px-3 py-2 shadow-sm dark:border-sky-800 dark:bg-slate-900"
            data-testid="up-next-match"
            key={match._id.toString()}
          >
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {match.label}
            </h3>
            <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
              {resolveTeamName(teams, match.teamA?.teamId ?? null) ??
                t("toBeDetermined")}{" "}
              {t("versus")}{" "}
              {resolveTeamName(teams, match.teamB?.teamId ?? null) ??
                t("toBeDetermined")}
            </p>
          </article>
        ))}
      </div>
    </aside>
  );
}
