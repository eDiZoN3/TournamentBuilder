import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  PlayerAccountView,
  type PlayerAccountStats,
} from "@/components/player/PlayerAccountView";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { Tournament, type ITournament } from "@/lib/models/Tournament";
import { aggregateStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== "player") {
    redirect("/signup");
  }

  await connectDB();

  const [profile, tournaments] = await Promise.all([
    PlayerProfile.findOne({ userId: session.user.id }).lean(),
    Tournament.find().lean(),
  ]);

  if (!profile) {
    redirect("/signup");
  }

  const stats = aggregateStats(
    JSON.parse(JSON.stringify(tournaments)) as ITournament[],
  );
  const playerStats = stats.players.find(
    (row) =>
      row.name.trim().toLowerCase() ===
      profile.displayName.trim().toLowerCase(),
  );
  const accountStats: PlayerAccountStats | null = playerStats
    ? {
        matchesPlayed: playerStats.matchesPlayed,
        matchesWon: playerStats.matchesWon,
        pointsFor: playerStats.pointsFor,
        winRate: playerStats.winRate,
      }
    : null;

  return (
    <PlayerAccountView
      profile={{
        _id: profile._id.toString(),
        userId: profile.userId.toString(),
        firstName: profile.firstName,
        surname: profile.surname ?? undefined,
        displayName: profile.displayName,
        email: profile.email,
      }}
      stats={accountStats}
    />
  );
}
