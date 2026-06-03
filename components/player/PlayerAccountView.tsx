export interface PlayerAccountProfile {
  _id: string;
  displayName: string;
  email: string;
  firstName: string;
  surname?: string;
  userId: string;
}

export interface PlayerAccountStats {
  matchesPlayed: number;
  matchesWon: number;
  pointsFor: number;
  winRate: number;
}

interface PlayerAccountViewProps {
  profile: PlayerAccountProfile;
  stats: PlayerAccountStats | null;
}

export function PlayerAccountView({ profile, stats }: PlayerAccountViewProps) {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Player account
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {profile.displayName}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{profile.email}</p>
      </header>

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Matches</p>
            <p className="mt-1 text-2xl font-bold">{stats.matchesPlayed}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Wins</p>
            <p className="mt-1 text-2xl font-bold">{stats.matchesWon}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Points</p>
            <p className="mt-1 text-2xl font-bold">{stats.pointsFor}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Win rate</p>
            <p className="mt-1 text-2xl font-bold">
              {Math.round(stats.winRate * 100)}%
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-white">No completed matches yet.</p>
        </div>
      )}
    </section>
  );
}
