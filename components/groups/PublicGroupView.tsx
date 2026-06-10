"use client";

import useSWR from "swr";
import { BracketView } from "@/components/bracket/BracketView";
import { GroupLeaderboard } from "@/components/groups/GroupLeaderboard";
import type { ITournamentGroup } from "@/lib/models/TournamentGroup";

interface PublicGroupViewProps {
  initialGroup: ITournamentGroup;
}

async function fetchGroup(url: string): Promise<ITournamentGroup> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Unable to refresh group");
  return response.json() as Promise<ITournamentGroup>;
}

export function PublicGroupView({ initialGroup }: PublicGroupViewProps) {
  const groupId = initialGroup._id.toString();

  const { data } = useSWR<ITournamentGroup>(
    `/api/groups/${groupId}`,
    fetchGroup,
    {
      fallbackData: initialGroup,
      refreshInterval: (latest) => (latest?.status === "completed" ? 0 : 5000),
    },
  );

  const group = data ?? initialGroup;
  const sortedCategories = [...group.categories].sort(
    (a, b) => a.position - b.position,
  );

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">{group.name}</h1>

      {group.status === "completed" && <GroupLeaderboard group={group} />}

      {group.status !== "draft" &&
        sortedCategories.map((cat) => (
          <details key={cat._id.toString()} open className="rounded border p-4">
            <summary className="cursor-pointer font-semibold">{cat.name}</summary>
            <div className="mt-4">
              <BracketView
                matches={cat.matches as never[]}
                teams={group.teams as never[]}
              />
            </div>
          </details>
        ))}
    </section>
  );
}
