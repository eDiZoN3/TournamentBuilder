import type { ITournamentGroup, IGroupMatch, IGroupTeam } from "@/lib/models/TournamentGroup";

export interface LeaderboardRow {
  teamId: string;
  teamName: string;
  totalScore: number;
  totalWins: number;
  placements: number[];
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

  // Collect all team IDs that appear in any category's completed matches
  const allTeamIds = new Set<string>();
  for (const category of group.categories) {
    for (const match of category.matches) {
      if (match.status === "completed" && !match.isBye) {
        if (match.teamA) allTeamIds.add(match.teamA.teamId.toString());
        if (match.teamB) allTeamIds.add(match.teamB.teamId.toString());
      }
    }
  }

  if (allTeamIds.size === 0) return [];

  const rows: LeaderboardRow[] = [];

  for (const teamIdStr of allTeamIds) {
    const team = teamMap.get(teamIdStr);
    const placements: number[] = [];
    let totalWins = 0;
    let hasAnyPlacement = false;

    for (const category of group.categories) {
      const placement = getTeamPlacement(category.matches, teamIdStr);
      if (placement !== null) {
        placements.push(placement);
        hasAnyPlacement = true;
      }
      totalWins += countWins(category.matches, teamIdStr);
    }

    if (!hasAnyPlacement) continue;

    const totalScore = placements.reduce((sum, p) => sum + p, 0);

    rows.push({
      teamId: teamIdStr,
      teamName: team?.name ?? teamIdStr,
      totalScore,
      totalWins,
      placements,
    });
  }

  rows.sort((a, b) => {
    if (a.totalScore !== b.totalScore) return a.totalScore - b.totalScore;
    return b.totalWins - a.totalWins;
  });

  return rows;
}
