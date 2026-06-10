import type { ITournamentGroup, IGroupMatch, IGroupTeam } from "@/lib/models/TournamentGroup";

export interface LeaderboardRow {
  teamId: string;
  teamName: string;
  totalScore: number;
  totalWins: number;
  placements: (number | null)[];
}

function getTeamPlacement(matches: IGroupMatch[], teamIdStr: string): number | null {
  const finalMatch = matches.find((m) => m.isWBFinal);
  if (!finalMatch || finalMatch.status !== "completed") return null;

  if (finalMatch.winnerId?.toString() === teamIdStr) return 1;
  if (finalMatch.loserId?.toString() === teamIdStr) return 2;

  // Team was eliminated in an earlier round
  const eliminationMatch = matches.find(
    (m) =>
      m.status === "completed" &&
      !m.isBye &&
      m.loserId?.toString() === teamIdStr,
  );
  if (!eliminationMatch) return null;

  // bracketSize = 2^totalWBRounds = 2^(finalMatch.round)
  const totalWBRounds = finalMatch.round;
  const eliminationRound = eliminationMatch.round;
  // first_place for losers of eliminationRound = 2^(totalWBRounds - eliminationRound) + 1
  return 2 ** (totalWBRounds - eliminationRound) + 1;
}

function countWins(matches: IGroupMatch[], teamIdStr: string): number {
  return matches.filter(
    (m) =>
      m.status === "completed" &&
      !m.isBye &&
      m.winnerId?.toString() === teamIdStr,
  ).length;
}

export function computeLeaderboard(group: ITournamentGroup): LeaderboardRow[] {
  if (group.categories.length === 0) return [];

  const teamMap = new Map<string, IGroupTeam>(
    group.teams.map((t) => [t._id.toString(), t]),
  );

  if (teamMap.size === 0) return [];

  const sortedCategories = [...group.categories].sort(
    (a, b) => a.position - b.position,
  );

  const rows: LeaderboardRow[] = [];

  for (const [teamIdStr, team] of teamMap) {
    const placements: (number | null)[] = [];
    let totalWins = 0;

    for (const category of sortedCategories) {
      placements.push(getTeamPlacement(category.matches, teamIdStr));
      totalWins += countWins(category.matches, teamIdStr);
    }

    const knownPlacements = placements.filter((p): p is number => p !== null);
    const totalScore = knownPlacements.reduce((sum, p) => sum + p, 0);

    rows.push({
      teamId: teamIdStr,
      teamName: team.name,
      totalScore,
      totalWins,
      placements,
    });
  }

  rows.sort((a, b) => {
    const aKnown = a.placements.some((p) => p !== null);
    const bKnown = b.placements.some((p) => p !== null);
    if (aKnown !== bKnown) return aKnown ? -1 : 1;
    if (!aKnown) return 0;
    if (a.totalScore !== b.totalScore) return a.totalScore - b.totalScore;
    return b.totalWins - a.totalWins;
  });

  return rows;
}
