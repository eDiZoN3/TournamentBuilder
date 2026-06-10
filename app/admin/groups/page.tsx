import { connectDB } from "@/lib/db";
import { TournamentGroup } from "@/lib/models/TournamentGroup";
import { GroupsListView } from "@/components/groups/GroupsListView";

export const dynamic = "force-dynamic";

export default async function AdminGroupsListPage() {
  await connectDB();

  const groups = await TournamentGroup.find().sort({ createdAt: -1 }).lean();

  const serialized = groups.map((g) => ({
    _id: g._id.toString(),
    name: g.name,
    status: g.status,
    teams: g.teams,
    categories: g.categories,
  }));

  return <GroupsListView groups={serialized} />;
}
