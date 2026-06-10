"use client";

import Link from "next/link";
import { useLocale } from "@/components/ui/LocaleProvider";

interface GroupSummary {
  _id: string;
  name: string;
  status: string;
  teams: unknown[];
  categories: unknown[];
}

interface GroupsListViewProps {
  groups: GroupSummary[];
}

export function GroupsListView({ groups }: GroupsListViewProps) {
  const { t } = useLocale();

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t("tournamentGroups")}
        </h1>
        <Link
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          href="/admin/groups/new"
        >
          {t("newGroup")}
        </Link>
      </div>

      {groups.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">{t("noGroupsYet")}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  {t("name")}
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  {t("status")}
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  {t("teams")}
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  {t("categories")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {groups.map((g) => (
                <tr
                  key={g._id}
                  className="bg-white dark:bg-slate-900"
                >
                  <td className="px-4 py-3">
                    <Link
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                      href={`/admin/groups/${g._id}`}
                    >
                      {g.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {g.status}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {g.teams.length}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {g.categories.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
