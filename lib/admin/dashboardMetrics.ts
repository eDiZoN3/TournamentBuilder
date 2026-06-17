import { connectDB } from "@/lib/db";
import { Tournament } from "@/lib/models/Tournament";
import { User } from "@/lib/models/User";

export interface AdminDashboardMetrics {
  playedMatches: number;
  registeredAdmins: number;
  registeredPlayers: number;
  registeredTournaments: number;
  tournamentsByStatus: {
    active: number;
    completed: number;
    draft: number;
  };
}

type TournamentStatus = keyof AdminDashboardMetrics["tournamentsByStatus"];

export const emptyAdminDashboardMetrics: AdminDashboardMetrics = {
  playedMatches: 0,
  registeredAdmins: 0,
  registeredPlayers: 0,
  registeredTournaments: 0,
  tournamentsByStatus: {
    active: 0,
    completed: 0,
    draft: 0,
  },
};

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  await connectDB();

  const [registeredAdmins, registeredPlayers, tournaments] = await Promise.all([
    User.countDocuments({ role: { $in: ["admin", "tournament_lead"] } }),
    User.countDocuments({ role: "player" }),
    Tournament.find().select("status matches").lean(),
  ]);
  const metrics: AdminDashboardMetrics = {
    ...emptyAdminDashboardMetrics,
    tournamentsByStatus: {
      ...emptyAdminDashboardMetrics.tournamentsByStatus,
    },
    registeredAdmins,
    registeredPlayers,
    registeredTournaments: tournaments.length,
  };

  for (const tournament of tournaments) {
    const status = tournament.status as TournamentStatus;
    if (status in metrics.tournamentsByStatus) {
      metrics.tournamentsByStatus[status] += 1;
    }
    metrics.playedMatches += tournament.matches.filter(
      (match) => match.status === "completed" && !match.isBye,
    ).length;
  }

  return metrics;
}
