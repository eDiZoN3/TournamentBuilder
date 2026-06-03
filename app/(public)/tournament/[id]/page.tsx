import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { notFound } from "next/navigation";
import { PublicTournamentView } from "@/components/bracket/PublicTournamentView";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { Tournament, type ITournament } from "@/lib/models/Tournament";

interface TournamentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectDB();

  const tournament = await Tournament.findById(id).lean();

  if (!tournament) {
    notFound();
  }

  let session = null;

  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }

  const profile =
    session?.user.role === "player"
      ? await PlayerProfile.findOne({ userId: session.user.id }).lean()
      : null;

  const initialTournament = JSON.parse(
    JSON.stringify(tournament),
  ) as ITournament;

  return (
    <PublicTournamentView
      currentPlayerName={profile?.displayName ?? null}
      initialTournament={initialTournament}
    />
  );
}
