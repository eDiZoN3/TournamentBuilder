import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { TournamentGroup } from "@/lib/models/TournamentGroup";
import { PublicGroupView } from "@/components/groups/PublicGroupView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicGroupDetailPage({ params }: PageProps) {
  const { id } = await params;
  await connectDB();

  const group = await TournamentGroup.findById(id).lean();
  if (!group) notFound();

  return (
    <main className="p-6">
      <PublicGroupView initialGroup={group} />
    </main>
  );
}
