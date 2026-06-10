"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/ui/LocaleProvider";
import type { IMatch, ITeamSlot } from "@/lib/models/Tournament";

interface MatchCardProps {
  children?: ReactNode;
  isPinned?: boolean;
  match: IMatch;
  teamAIsCurrentPlayerTeam?: boolean;
  teamAName?: string;
  teamBIsCurrentPlayerTeam?: boolean;
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
    return "text-slate-700 dark:text-slate-200";
  }

  return slot.teamId.toString() === winnerId.toString()
    ? "font-semibold text-emerald-700 dark:text-emerald-300"
    : "text-slate-400 dark:text-slate-500";
}

function MatchRow({
  team,
  scores,
  side,
  isCurrentPlayerTeam,
  winnerId,
  completed,
}: {
  team: DisplayTeam;
  scores: number[];
  side: "a" | "b";
  isCurrentPlayerTeam: boolean;
  winnerId: IMatch["winnerId"];
  completed: boolean;
}) {
  return (
    <div
      className={`flex min-h-8 items-center justify-between gap-3 px-3 py-1.5 ${
        isCurrentPlayerTeam
          ? "bg-sky-50 text-sky-900 ring-1 ring-inset ring-sky-200 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-700"
          : rowClasses(team.slot, winnerId, completed)
      }`}
      data-current-player-team={isCurrentPlayerTeam}
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
  children,
  isPinned = false,
  match,
  teamAIsCurrentPlayerTeam = false,
  teamAName,
  teamBIsCurrentPlayerTeam = false,
  teamBName,
}: MatchCardProps) {
  const { t } = useLocale();
  const fallbackTeamName = t("toBeDetermined");
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
          ? { name: teamAName ?? fallbackTeamName, slot: match.teamA }
          : { name: teamBName ?? fallbackTeamName, slot: match.teamB },
        { name: "—", slot: null },
      ]
    : [
        { name: match.teamA ? (teamAName ?? fallbackTeamName) : fallbackTeamName, slot: match.teamA },
        { name: match.teamB ? (teamBName ?? fallbackTeamName) : fallbackTeamName, slot: match.teamB },
      ];
  const cardClasses = [
    "group relative w-64 overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-slate-900",
    isPinned ? "z-40 opacity-100 shadow-xl" : "z-10",
    match.status === "pending" && !match.isBye && !isPinned
      ? "border-slate-200 opacity-60"
      : "border-slate-300",
    isLive
      ? `${isPinned ? "" : "animate-pulse "}border-amber-400 ring-2 ring-amber-200 dark:border-amber-500 dark:ring-amber-700`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  const controlsLayerClasses = [
    "md:absolute md:inset-x-0 md:bottom-0",
    isPinned
      ? "md:block"
      : "md:hidden md:group-hover:block md:group-focus-within:block",
  ].join(" ");

  return (
    <article
      className={cardClasses}
      data-match-id={match._id.toString()}
      data-testid="match-card"
      id={`match-${match._id.toString()}`}
    >
      <header className="border-b border-slate-200 bg-slate-50 px-3 py-2 pr-16 dark:border-slate-700 dark:bg-slate-800">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-600">
          {match.label}
        </p>
        {match.placeRange ? (
          <p className="truncate text-xs text-slate-500">{match.placeRange}</p>
        ) : null}
      </header>
      {isLive && match.courtNumber !== null ? (
        <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900 dark:text-amber-100">
          {t("court")} {match.courtNumber}
        </span>
      ) : null}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <MatchRow
          completed={isCompleted}
          isCurrentPlayerTeam={teamAIsCurrentPlayerTeam}
          scores={sets.map((set) => set.scoreA)}
          side="a"
          team={teams[0]}
          winnerId={match.winnerId}
        />
        <MatchRow
          completed={isCompleted}
          isCurrentPlayerTeam={teamBIsCurrentPlayerTeam}
          scores={sets.map((set) => set.scoreB)}
          side="b"
          team={teams[1]}
          winnerId={match.winnerId}
        />
      </div>
      <footer className="border-t border-slate-100 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-800">
        {isLive
          ? t("live")
          : isCompleted
            ? t("completed")
            : match.status === "ready"
              ? t("ready")
              : t("pending")}
      </footer>
      {children ? (
        <div className={controlsLayerClasses}>
          {children}
        </div>
      ) : null}
    </article>
  );
}
