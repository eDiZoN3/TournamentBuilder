import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  PlayerAccountView,
  type PlayerAccountStats,
} from "@/components/player/PlayerAccountView";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { PracticeMatch } from "@/lib/models/PracticeMatch";
import { StatsReset } from "@/lib/models/StatsReset";
import { Tournament, type ITournament } from "@/lib/models/Tournament";
import { serializePracticeMatch } from "@/lib/practiceMatches";
import { aggregatePracticeStats } from "@/lib/practiceStats";
import { aggregateStats, type StatsResetRule } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== "player") {
    redirect("/signup");
  }

  await connectDB();

  const [profile, tournaments, resetRules] = await Promise.all([
    PlayerProfile.findOne({ userId: session.user.id }).lean(),
    Tournament.find().lean(),
    StatsReset.find().lean(),
  ]);

  if (!profile) {
    redirect("/signup");
  }

  const serializedResetRules = JSON.parse(
    JSON.stringify(resetRules),
  ) as StatsResetRule[];
  const practiceMatches = await PracticeMatch.find({
    $or: [
      { createdBy: profile._id },
      { "sideA.playerProfileId": profile._id },
      { "sideB.playerProfileId": profile._id },
    ],
  })
    .sort({ playedAt: -1, createdAt: -1 })
    .lean();
  const stats = aggregateStats(
    JSON.parse(JSON.stringify(tournaments)) as ITournament[],
    serializedResetRules,
  );
  const practiceStats = aggregatePracticeStats(
    JSON.parse(JSON.stringify(practiceMatches)),
    serializedResetRules,
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
  const playerPracticeStats = practiceStats.find(
    (row) => row.playerProfileId === profile._id.toString(),
  );
  const accountPracticeStats: PlayerAccountStats | null = playerPracticeStats
    ? {
        matchesPlayed: playerPracticeStats.matchesPlayed,
        matchesWon: playerPracticeStats.matchesWon,
        pointsFor: playerPracticeStats.pointsFor,
        winRate: playerPracticeStats.winRate,
      }
    : null;

  return (
    <PlayerAccountView
      practiceMatches={practiceMatches.map(serializePracticeMatch)}
      practiceStats={accountPracticeStats}
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
