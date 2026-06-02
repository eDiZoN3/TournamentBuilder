import type { IMatch, ITeamSlot } from "@/lib/models/Tournament";

interface MatchCardProps {
  match: IMatch;
  teamAName?: string;
  teamBName?: string;
}

interface DisplayTeam {
  name: string;
  slot: ITeamSlot | null;
}

function rowClasses(
  slot: ITeamSlot | null,
  winnerId: IMatch["winnerId"],
  completed: boolean,
): string {
  if (!completed || !slot || !winnerId) {
    return "text-slate-700";
  }

  return slot.teamId.toString() === winnerId.toString()
    ? "font-semibold text-emerald-700"
    : "text-slate-400";
}

function MatchRow({
  team,
  scores,
  side,
  winnerId,
  completed,
}: {
  team: DisplayTeam;
  scores: number[];
  side: "a" | "b";
  winnerId: IMatch["winnerId"];
  completed: boolean;
}) {
  return (
    <div
      className={`flex min-h-8 items-center justify-between gap-3 px-3 py-1.5 ${rowClasses(
        team.slot,
        winnerId,
        completed,
      )}`}
      data-testid={`team-${side}-row`}
    >
      <span className="truncate">{team.name}</span>
      {scores.length > 0 ? (
        <span
          className="flex shrink-0 gap-2 font-mono text-xs"
          data-testid={`team-${side}-scores`}
        >
          {scores.map((score, index) => (
            <span key={index}>{score}</span>
          ))}
        </span>
      ) : null}
    </div>
  );
}

export function MatchCard({
  match,
  teamAName = "TBD",
  teamBName = "TBD",
}: MatchCardProps) {
  const isCompleted = match.status === "completed" || match.isBye;
  const isLive = match.status === "in_progress" && !match.isBye;
  const sets =
    !match.isBye && match.teamA?.sets.length
      ? match.teamA.sets
      : !match.isBye
        ? (match.teamB?.sets ?? [])
        : [];
  const teams: [DisplayTeam, DisplayTeam] = match.isBye
    ? [
        match.teamA
          ? { name: teamAName, slot: match.teamA }
          : { name: teamBName, slot: match.teamB },
        { name: "—", slot: null },
      ]
    : [
        { name: match.teamA ? teamAName : "TBD", slot: match.teamA },
        { name: match.teamB ? teamBName : "TBD", slot: match.teamB },
      ];
  const cardClasses = [
    "relative z-10 w-64 overflow-hidden rounded-lg border bg-white shadow-sm",
    match.status === "pending" && !match.isBye
      ? "border-slate-200 opacity-60"
      : "border-slate-300",
    isLive ? "animate-pulse border-amber-400 ring-2 ring-amber-200" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClasses}
      data-match-id={match._id.toString()}
      data-testid="match-card"
      id={`match-${match._id.toString()}`}
    >
      <header className="border-b border-slate-200 bg-slate-50 px-3 py-2 pr-16">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-600">
          {match.label}
        </p>
        {match.placeRange ? (
          <p className="truncate text-xs text-slate-500">{match.placeRange}</p>
        ) : null}
      </header>
      {isLive && match.courtNumber !== null ? (
        <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
          Court {match.courtNumber}
        </span>
      ) : null}
      <div className="divide-y divide-slate-100">
        <MatchRow
          completed={isCompleted}
          scores={sets.map((set) => set.scoreA)}
          side="a"
          team={teams[0]}
          winnerId={match.winnerId}
        />
        <MatchRow
          completed={isCompleted}
          scores={sets.map((set) => set.scoreB)}
          side="b"
          team={teams[1]}
          winnerId={match.winnerId}
        />
      </div>
      <footer className="border-t border-slate-100 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        {isLive
          ? "LIVE"
          : isCompleted
            ? "Completed"
            : match.status === "ready"
              ? "Ready"
              : "Pending"}
      </footer>
    </article>
  );
}
