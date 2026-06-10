import type { ITournamentGroup, IGroupMatch } from "@/lib/models/TournamentGroup";

export interface MatchActivation {
  categoryIndex: number;
  matchId: string;
}

function teamIdsOf(match: IGroupMatch): string[] {
  const ids: string[] = [];
  if (match.teamA) ids.push(match.teamA.teamId.toString());
  if (match.teamB) ids.push(match.teamB.teamId.toString());
  return ids;
}

export function computeNextMatches(group: ITournamentGroup): MatchActivation[] {
  const activeTeamIds = new Set<string>();

  for (const category of group.categories) {
    for (const match of category.matches) {
      if (match.status === "in_progress") {
        for (const id of teamIdsOf(match)) {
          activeTeamIds.add(id);
        }
      }
    }
  }

  // Build index mapping: sorted category → original index
  const indexed = group.categories.map((cat, originalIndex) => ({
    cat,
    originalIndex,
  }));
  indexed.sort((a, b) => a.cat.position - b.cat.position);

  const activations: MatchActivation[] = [];

  for (const { cat, originalIndex } of indexed) {
    const hasActive = cat.matches.some((m) => m.status === "in_progress");
    if (hasActive) continue;

    const readyMatch = cat.matches.find((m) => {
      if (m.status !== "ready") return false;
      return teamIdsOf(m).every((id) => !activeTeamIds.has(id));
    });

    if (readyMatch) {
      activations.push({
        categoryIndex: originalIndex,
        matchId: readyMatch._id.toString(),
      });
      for (const id of teamIdsOf(readyMatch)) {
        activeTeamIds.add(id);
      }
    }
  }

  return activations;
}
