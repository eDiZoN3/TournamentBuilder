"use client";

import { TeamCrest } from "@/components/bracket/TeamCrest";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLocale } from "@/components/ui/LocaleProvider";
import type { TranslationKey } from "@/lib/i18n";
import type { StatsRow } from "@/lib/stats";

interface StatsTableProps {
  emptyTitle: string;
  emptyTitleKey?: TranslationKey;
  isLoading?: boolean;
  rows: StatsRow[];
  /** Show each row's team coat of arms (knight theme only). Team tables only. */
  showCrests?: boolean;
  showScoreStats?: boolean;
  showTournamentPoints?: boolean;
  title: string;
  titleKey?: TranslationKey;
}

function formatWinRate(winRate: number): string {
  return `${Math.round(winRate * 100)}%`;
}

export function StatsTable({
  emptyTitle,
  emptyTitleKey,
  isLoading = false,
  rows,
  showCrests = false,
  showScoreStats = true,
  showTournamentPoints = false,
  title,
  titleKey,
}: StatsTableProps) {
  const { t } = useLocale();
  const displayTitle = titleKey ? t(titleKey) : title;
  const displayEmptyTitle = emptyTitleKey ? t(emptyTitleKey) : emptyTitle;

  if (isLoading) {
    return (
      <section aria-busy="true" className="space-y-3">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {displayTitle}
        </h3>
        <span className="sr-only">{t("loading")} {displayTitle}</span>
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton className="h-10 w-full" key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title={displayEmptyTitle} />;
  }

  return (
    <section className="min-w-0 space-y-3">
      <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
        {displayTitle}
      </h3>
      <div className="max-w-full overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="min-w-max divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="px-3 py-3" scope="col">
                {t("name")}
              </th>
              <th className="px-3 py-3 text-right" scope="col">
                {t("played")}
              </th>
              <th className="px-3 py-3 text-right" scope="col">
                {t("won")}
              </th>
              <th className="px-3 py-3 text-right" scope="col">
                {t("lost")}
              </th>
              {showTournamentPoints ? (
                <th className="px-3 py-3 text-right" scope="col">
                  {t("totalPoints")}
                </th>
              ) : null}
              {showScoreStats ? (
                <>
                  <th className="px-3 py-3 text-right" scope="col">
                    {t("setsWonLost")}
                  </th>
                  <th className="px-3 py-3 text-right" scope="col">
                    {t("pointsFor")}
                  </th>
                  <th className="px-3 py-3 text-right" scope="col">
                    {t("pointsAgainst")}
                  </th>
                  <th className="px-3 py-3 text-right" scope="col">
                    {t("pointsDiff")}
                  </th>
                </>
              ) : null}
              <th className="px-3 py-3 text-right" scope="col">
                {t("winRate")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row, index) => (
              <tr key={`${row.name}-${index}`}>
                <th
                  className="max-w-64 break-words px-3 py-3 text-left font-semibold text-slate-900 dark:text-white"
                  scope="row"
                >
                  {showCrests ? (
                    <span className="flex items-center">
                      <TeamCrest teamName={row.name} />
                      <span className="min-w-0 break-words">{row.name}</span>
                    </span>
                  ) : (
                    row.name
                  )}
                </th>
                <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                  {row.matchesPlayed}
                </td>
                <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                  {row.matchesWon}
                </td>
                <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                  {row.matchesLost}
                </td>
                {showTournamentPoints ? (
                  <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                    {row.tournamentPoints ?? 0}
                  </td>
                ) : null}
                {showScoreStats ? (
                  <>
                    <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                      {row.setsWon}-{row.setsLost}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                      {row.pointsFor}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                      {row.pointsAgainst}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                      {row.pointDiff}
                    </td>
                  </>
                ) : null}
                <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                  {formatWinRate(row.winRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
