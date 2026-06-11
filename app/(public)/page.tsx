import Link from "next/link";
import { LocalizedText } from "@/components/ui/LocalizedText";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { connectDB } from "@/lib/db";
import { Tournament } from "@/lib/models/Tournament";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await connectDB();

  const tournaments = await Tournament.find().sort({ createdAt: -1 }).lean();

  return (
    <section>
      <h1 className="text-3xl font-bold tracking-tight">
        <LocalizedText k="volleyballTournaments" />
      </h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        <LocalizedText k="followCurrentTournaments" />
      </p>
      {tournaments.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <LocalizedText k="noTournamentsYet" />
        </p>
      ) : (
        <div className="mt-8 grid gap-4">
          {tournaments.map((tournament) => (
            <Link
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500 dark:focus-visible:ring-offset-slate-950"
              href={`/tournament/${tournament._id.toString()}`}
              key={tournament._id.toString()}
            >
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  {tournament.name}
                </h2>
                <time
                  className="mt-1 block text-sm text-slate-500 dark:text-slate-400"
                  dateTime={tournament.createdAt.toISOString()}
                >
                  {tournament.createdAt.toLocaleDateString("en-US", {
                    dateStyle: "medium",
                  })}
                </time>
              </div>
              <StatusBadge status={tournament.status} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
