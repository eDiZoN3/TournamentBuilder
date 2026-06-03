import {
  AdminDashboard,
  type TournamentSummary,
} from "@/components/admin/AdminDashboard";
import type { AdminUserSummary } from "@/components/admin/AdminUsersPanel";
import { getAdminDashboardMetrics } from "@/lib/admin/dashboardMetrics";
import { getPlayerUserSummaries } from "@/lib/admin/playerAccounts";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Tournament } from "@/lib/models/Tournament";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await connectDB();

  const [tournaments, admins, initialPlayers, initialMetrics] = await Promise.all([
    Tournament.find().sort({ createdAt: -1 }).lean(),
    User.find({ role: "admin" }).sort({ createdAt: -1 }),
    getPlayerUserSummaries(),
    getAdminDashboardMetrics(),
  ]);
  const initialTournaments: TournamentSummary[] = tournaments.map((tournament) => ({
    _id: tournament._id.toString(),
    name: tournament.name,
    status: tournament.status,
    createdAt: tournament.createdAt.toISOString(),
    teamCount: tournament.teams.length,
    matchCount: tournament.matches.filter((match) => !match.isBye).length,
  }));
  const initialAdmins: AdminUserSummary[] = admins.map((admin) => ({
    _id: admin._id.toString(),
    email: admin.email,
    mustChangePassword: admin.mustChangePassword,
    createdAt: admin.createdAt.toISOString(),
  }));

  return (
    <AdminDashboard
      initialAdmins={initialAdmins}
      initialMetrics={initialMetrics}
      initialPlayers={initialPlayers}
      initialTournaments={initialTournaments}
    />
  );
}
