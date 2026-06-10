import Link from "next/link";
import { connectDB } from "@/lib/db";
import { TournamentGroup } from "@/lib/models/TournamentGroup";

export const dynamic = "force-dynamic";

export default async function PublicGroupsPage() {
  await connectDB();

  const groups = await TournamentGroup.find({
    status: { $in: ["active", "completed"] },
  })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tournament Groups</h1>
      {groups.length === 0 ? (
        <p className="text-gray-500">No tournament groups yet.</p>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => (
            <li key={g._id.toString()}>
              <Link
                href={`/groups/${g._id}`}
                className="text-blue-600 hover:underline"
              >
                {g.name}
              </Link>
              <span className="ml-2 text-sm text-gray-500">{g.status}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
