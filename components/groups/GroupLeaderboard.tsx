"use client";

import { computeLeaderboard } from "@/lib/groups/leaderboard";
import type { ITournamentGroup } from "@/lib/models/TournamentGroup";

interface GroupLeaderboardProps {
  group: ITournamentGroup;
}

function ordinal(n: number): string {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : n % 10 === 1
        ? "st"
        : n % 10 === 2
          ? "nd"
          : n % 10 === 3
            ? "rd"
            : "th";
  return `${n}${suffix}`;
}

export function GroupLeaderboard({ group }: GroupLeaderboardProps) {
  if (group.status !== "completed") return null;

  const rows = computeLeaderboard(group);
  const sortedCategories = [...group.categories].sort(
    (a, b) => a.position - b.position,
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="py-2 pr-4">Rank</th>
            <th className="py-2 pr-4">Team</th>
            {sortedCategories.map((cat) => (
              <th key={cat._id.toString()} className="py-2 pr-4">
                {cat.name}
              </th>
            ))}
            <th className="py-2 pr-4">Total Score</th>
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
                      ? ordinal(row.placements[catIndex])
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
