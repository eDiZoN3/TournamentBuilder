import { Types } from "mongoose";
import { notFound } from "next/navigation";
import { TournamentManageView } from "@/components/admin/TournamentManageView";
import { connectDB } from "@/lib/db";
import { Tournament, type ITournament } from "@/lib/models/Tournament";

interface ManageTournamentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ManageTournamentPage({
  params,
}: ManageTournamentPageProps) {
  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectDB();

  const tournament = await Tournament.findById(id).lean();

  if (!tournament) {
    notFound();
  }

  const initialTournament = JSON.parse(
    JSON.stringify(tournament),
  ) as ITournament;

  return <TournamentManageView initialTournament={initialTournament} />;
}
