import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { StatsRow } from "@/lib/stats";

interface StatsTableProps {
  emptyTitle: string;
  isLoading?: boolean;
  rows: StatsRow[];
  title: string;
}

function formatWinRate(winRate: number): string {
  return `${Math.round(winRate * 100)}%`;
}

export function StatsTable({
  emptyTitle,
  isLoading = false,
  rows,
  title,
}: StatsTableProps) {
  if (isLoading) {
    return (
      <section aria-busy="true" className="space-y-3">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>
        <span className="sr-only">Loading {title}</span>
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton className="h-10 w-full" key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="px-3 py-3" scope="col">
                Name
              </th>
              <th className="px-3 py-3 text-right" scope="col">
                Played
              </th>
              <th className="px-3 py-3 text-right" scope="col">
                Won
              </th>
              <th className="px-3 py-3 text-right" scope="col">
                Lost
              </th>
              <th className="px-3 py-3 text-right" scope="col">
                Sets W-L
              </th>
              <th className="px-3 py-3 text-right" scope="col">
                Points For
              </th>
              <th className="px-3 py-3 text-right" scope="col">
                Points Against
              </th>
              <th className="px-3 py-3 text-right" scope="col">
                Points +/-
              </th>
              <th className="px-3 py-3 text-right" scope="col">
                Win rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row, index) => (
              <tr key={`${row.name}-${index}`}>
                <th
                  className="max-w-52 truncate px-3 py-3 text-left font-semibold text-slate-900 dark:text-white"
                  scope="row"
                >
                  {row.name}
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
