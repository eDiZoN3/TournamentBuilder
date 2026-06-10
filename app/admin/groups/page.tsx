import Link from "next/link";
import { connectDB } from "@/lib/db";
import { TournamentGroup } from "@/lib/models/TournamentGroup";

export const dynamic = "force-dynamic";

export default async function AdminGroupsListPage() {
  await connectDB();

  const groups = await TournamentGroup.find().sort({ createdAt: -1 }).lean();

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tournament Groups</h1>
        <Link
          href="/admin/groups/new"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          New group
        </Link>
      </div>

      {groups.length === 0 ? (
        <p className="text-gray-500">No tournament groups yet.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Status</th>
              <th className="py-2">Teams</th>
              <th className="py-2">Categories</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g._id.toString()}>
                <td className="py-2">
                  <Link
                    href={`/admin/groups/${g._id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {g.name}
                  </Link>
                </td>
                <td className="py-2">{g.status}</td>
                <td className="py-2">{g.teams.length}</td>
                <td className="py-2">{g.categories.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
