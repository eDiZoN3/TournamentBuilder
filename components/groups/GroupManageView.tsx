"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { ScoreEntry } from "@/components/admin/ScoreEntry";
import { GroupLeaderboard } from "@/components/groups/GroupLeaderboard";
import { useLocale } from "@/components/ui/LocaleProvider";
import { computeNextMatches } from "@/lib/groups/scheduler";
import type { IGroupCategory, IGroupTeam, ITournamentGroup } from "@/lib/models/TournamentGroup";
import type { ITeamSlot } from "@/lib/models/Tournament";

function resolveTeamName(teams: IGroupTeam[], slot: ITeamSlot | null): string {
  if (!slot) return "TBD";
  const team = teams.find((t) => t._id.toString() === slot.teamId.toString());
  return team?.name ?? "TBD";
}

interface GroupManageViewProps {
  initialGroup: ITournamentGroup;
}

async function fetchGroup(url: string): Promise<ITournamentGroup> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Unable to refresh group");
  return response.json() as Promise<ITournamentGroup>;
}

interface ActiveScoreEntry {
  matchId: string;
  catId: string;
  teamAName: string;
  teamBName: string;
}

export function GroupManageView({ initialGroup }: GroupManageViewProps) {
  const groupId = initialGroup._id.toString();
  const { t } = useLocale();
  const refreshFailures = useRef(0);
  const [scoreEntry, setScoreEntry] = useState<ActiveScoreEntry | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const { data, mutate } = useSWR<ITournamentGroup>(
    `/api/groups/${groupId}`,
    fetchGroup,
    {
      fallbackData: initialGroup,
      refreshInterval: (latest) => (latest?.status === "completed" ? 0 : 5000),
      onError: () => { refreshFailures.current += 1; },
      onSuccess: () => { refreshFailures.current = 0; },
    },
  );

  const group = data ?? initialGroup;
  const activations = computeNextMatches(group);

  async function handleStart() {
    setStartError(null);
    setStarting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/start`, { method: "POST" });
      if (!res.ok) {
        setStartError(t("failedToStartGroup"));
      } else {
        await mutate();
      }
    } finally {
      setStarting(false);
    }
  }

  const activeMatch = scoreEntry
    ? group.categories
        .flatMap((cat) => cat.matches)
        .find((m) => m._id.toString() === scoreEntry.matchId)
    : null;

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        {group.status === "draft" && (
          <button
            type="button"
            onClick={handleStart}
            disabled={starting}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {t("startGroup")}
          </button>
        )}
      </header>

      {startError && <p className="text-red-600 text-sm">{startError}</p>}

      {group.status === "completed" ? (
        <GroupLeaderboard group={group} />
      ) : (
        <div className="space-y-4">
          {[...group.categories]
            .sort((a, b) => a.position - b.position)
            .map((cat) => (
              <CategoryLiveRow
                key={cat._id.toString()}
                category={cat}
                categoryIndex={group.categories.indexOf(cat)}
                activations={activations}
                groupId={groupId}
                teams={group.teams}
                onEnterScores={(matchId, teamAName, teamBName) =>
                  setScoreEntry({ matchId, catId: cat._id.toString(), teamAName, teamBName })
                }
              />
            ))}
        </div>
      )}

      {scoreEntry && activeMatch && (
        <ScoreEntry
          match={activeMatch}
          tournamentId={`${groupId}/categories/${scoreEntry.catId}`}
          teamAName={scoreEntry.teamAName}
          teamBName={scoreEntry.teamBName}
          onClose={() => setScoreEntry(null)}
          onUpdated={async () => { await mutate(); }}
        />
      )}
    </section>
  );
}

interface CategoryLiveRowProps {
  category: IGroupCategory;
  categoryIndex: number;
  activations: ReturnType<typeof computeNextMatches>;
  groupId: string;
  teams: IGroupTeam[];
  onEnterScores: (matchId: string, teamAName: string, teamBName: string) => void;
}

function CategoryLiveRow({
  category,
  categoryIndex,
  activations,
  teams,
  onEnterScores,
}: CategoryLiveRowProps) {
  const { t } = useLocale();
  const activeMatch = category.matches.find((m) => m.status === "in_progress");
  const activation = activations.find((a) => a.categoryIndex === categoryIndex);
  const nextMatch = activation
    ? category.matches.find((m) => m._id.toString() === activation.matchId)
    : null;
  const hasReadyMatches = category.matches.some(
    (m) => m.status === "ready" || m.status === "pending",
  );
  const isIdle = !activeMatch && !nextMatch && hasReadyMatches;

  return (
    <div className="rounded border p-4 space-y-2">
      <h2 className="font-semibold">{category.name}</h2>

      {activeMatch && (
        <div className="flex items-center gap-3">
          <span>
            {resolveTeamName(teams, activeMatch.teamA)} vs {resolveTeamName(teams, activeMatch.teamB)}
          </span>
          <button
            type="button"
            onClick={() =>
              onEnterScores(
                activeMatch._id.toString(),
                resolveTeamName(teams, activeMatch.teamA),
                resolveTeamName(teams, activeMatch.teamB),
              )
            }
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            {t("enterScores")}
          </button>
        </div>
      )}

      {nextMatch && !activeMatch && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">{t("nextQueuedMatch")}:</span> {nextMatch.label}
        </p>
      )}

      {isIdle && (
        <p className="text-sm text-amber-600">{t("idleWaitingForTeams")}</p>
      )}
    </div>
  );
}
