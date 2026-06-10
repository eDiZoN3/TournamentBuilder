"use client";

import { computeLeaderboard } from "@/lib/groups/leaderboard";
import { localizeOrdinal } from "@/lib/i18n";
import { useLocale } from "@/components/ui/LocaleProvider";
import type { ITournamentGroup } from "@/lib/models/TournamentGroup";

interface GroupLeaderboardProps {
  group: ITournamentGroup;
}

export function GroupLeaderboard({ group }: GroupLeaderboardProps) {
  const { locale, t } = useLocale();

  if (group.status === "draft") return null;

  const rows = computeLeaderboard(group);
  const sortedCategories = [...group.categories].sort(
    (a, b) => a.position - b.position,
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="py-2 pr-4">{t("rank")}</th>
            <th className="py-2 pr-4">{t("team")}</th>
            {sortedCategories.map((cat) => (
              <th key={cat._id.toString()} className="py-2 pr-4">
                {cat.name}
              </th>
            ))}
            <th className="py-2 pr-4">{t("totalScore")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rank =
              index > 0 && rows[index - 1].totalScore === row.totalScore
                ? null
                : index + 1;
            const displayRank =
              rank ??
              (() => {
                let r = index;
                while (r > 0 && rows[r - 1].totalScore === row.totalScore) r--;
                return r + 1;
              })();

            return (
              <tr key={row.teamId}>
                <td className="py-2 pr-4">{displayRank}</td>
                <td className="py-2 pr-4">{row.teamName}</td>
                {sortedCategories.map((cat, catIndex) => (
                  <td key={cat._id.toString()} className="py-2 pr-4">
                    {row.placements[catIndex] != null
                      ? localizeOrdinal(row.placements[catIndex] as number, locale)
                      : "—"}
                  </td>
                ))}
                <td className="py-2 pr-4">{row.totalScore}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
