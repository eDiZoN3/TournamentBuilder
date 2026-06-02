import {
  AdminDashboard,
  type TournamentSummary,
} from "@/components/admin/AdminDashboard";
import { connectDB } from "@/lib/db";
import { Tournament } from "@/lib/models/Tournament";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await connectDB();

  const tournaments = await Tournament.find().sort({ createdAt: -1 }).lean();
  const initialTournaments: TournamentSummary[] = tournaments.map((tournament) => ({
    _id: tournament._id.toString(),
    name: tournament.name,
    status: tournament.status,
    createdAt: tournament.createdAt.toISOString(),
    teamCount: tournament.teams.length,
    matchCount: tournament.matches.filter((match) => !match.isBye).length,
  }));

  return <AdminDashboard initialTournaments={initialTournaments} />;
}
