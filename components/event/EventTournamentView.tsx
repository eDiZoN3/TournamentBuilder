"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TeamCrest } from "@/components/bracket/TeamCrest";
import { resolveTeamName } from "@/components/bracket/utils";
import { TournamentStats } from "@/components/stats/TournamentStats";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useLocale } from "@/components/ui/LocaleProvider";
import { planEventSlots } from "@/lib/eventTournament";
import type { IMatch, ITeam, ITournament } from "@/lib/models/Tournament";

interface EventTournamentViewProps {
  currentPlayerName?: string | null;
  editable?: boolean;
  syncHealthy?: boolean;
  onUpdated?: () => Promise<void> | void;
  tournament: ITournament;
}

interface DisciplineGroup {
  index: number;
  matches: IMatch[];
  name: string;
}

function idString(id: { toString(): string } | string | null | undefined) {
  return id?.toString() ?? "";
}

function isCurrentPlayerTeam(
  tournament: ITournament,
  teamId: IMatch["winnerId"] | null,
  currentPlayerName: string | null,
): boolean {
  if (!currentPlayerName || !teamId) {
    return false;
  }

  const normalizedPlayer = currentPlayerName.trim().toLowerCase();
  const team = tournament.teams.find(
    (candidate) => idString(candidate._id) === idString(teamId),
  );

  return Boolean(
    team?.players.some(
      (player) => player.trim().toLowerCase() === normalizedPlayer,
    ),
  );
}

const DISCIPLINE_COLORS = [
  "#f2b63c",
  "#62b8e8",
  "#ef7d57",
  "#6fcf97",
  "#b58ce0",
];

function disciplineColor(index: number): string {
  return index < DISCIPLINE_COLORS.length
    ? DISCIPLINE_COLORS[index]
    : `hsl(${(45 + index * 67) % 360} 55% 62%)`;
}

function groupByDiscipline(matches: IMatch[]): DisciplineGroup[] {
  const groups = new Map<number, DisciplineGroup>();

  for (const match of matches) {
    const index = match.eventDisciplineIndex ?? 0;
    const existing = groups.get(index) ?? {
      index,
      matches: [],
      name: match.eventDisciplineName ?? `Discipline ${index + 1}`,
    };

    existing.matches.push(match);
    groups.set(index, existing);
  }

  return [...groups.values()]
    .sort((first, second) => first.index - second.index)
    .map((group) => ({
      ...group,
      matches: group.matches.sort(
        (first, second) =>
          first.round - second.round || first.position - second.position,
      ),
    }));
}

export function EventTournamentView({
  currentPlayerName = null,
  editable = false,
  syncHealthy = true,
  onUpdated,
  tournament,
}: EventTournamentViewProps) {
  const { t } = useLocale();
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);
  const [activeDiscipline, setActiveDiscipline] = useState(0);
  const [highlightedMatchId, setHighlightedMatchId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const highlightedRef = useRef<HTMLElement | null>(null);
  const pinnedFirstSlotMatchIdsRef = useRef<string[]>([]);
  const slots = useMemo(
    () =>
      planEventSlots(tournament.matches, {
        pinnedFirstSlotMatchIds: pinnedFirstSlotMatchIdsRef.current,
      }),
    [tournament.matches],
  );
  const disciplineGroups = useMemo(
    () => groupByDiscipline(tournament.matches),
    [tournament.matches],
  );
  const teamById = useMemo(() => {
    const map = new Map<string, ITeam>();

    for (const team of tournament.teams) {
      map.set(idString(team._id), team);
    }

    return map;
  }, [tournament.teams]);
  const nextSlot = slots[0];
  const recalculatedNextSlots = slots.slice(1);
  const selectedDisciplineIndex =
    disciplineGroups.length > 0
      ? Math.min(activeDiscipline, disciplineGroups.length - 1)
      : 0;
  const selectedGroup = disciplineGroups[selectedDisciplineIndex];

  useEffect(() => {
    pinnedFirstSlotMatchIdsRef.current =
      slots[0]?.matches.map((match) => match._id.toString()) ?? [];
  }, [slots]);

  useEffect(() => {
    if (!highlightedMatchId || !highlightedRef.current) {
      return;
    }

    highlightedRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });

    const timer = setTimeout(() => setHighlightedMatchId(null), 2500);

    return () => clearTimeout(timer);
  }, [highlightedMatchId, selectedDisciplineIndex]);

  function jumpToMatch(match: IMatch) {
    const targetIndex = disciplineGroups.findIndex(
      (group) => group.index === (match.eventDisciplineIndex ?? 0),
    );

    if (targetIndex >= 0) {
      setActiveDiscipline(targetIndex);
    }

    setHighlightedMatchId(match._id.toString());
  }

  function roundName(round: number, bracketSize: number) {
    const matchesInRound = bracketSize >> (round + 1);

    if (matchesInRound === 1) {
      return t("final");
    }

    if (matchesInRound === 2) {
      return t("semiFinal");
    }

    if (matchesInRound === 4) {
      return t("quarterFinal");
    }

    return `${t("round")} ${round + 1}`;
  }

  async function selectWinner(match: IMatch, winnerId: string) {
    if (!editable || !syncHealthy || !match.teamA || !match.teamB) {
      return;
    }

    setBusyMatchId(match._id.toString());
    setError(null);

    try {
      const response = await fetch(
        `/api/tournaments/${tournament._id.toString()}/event/matches/${match._id.toString()}/winner`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            tournamentUpdatedAt: new Date(tournament.updatedAt).toISOString(),
            winnerId,
          }),
        },
      );

      if (!response.ok) {
        let errorCode: string | null = null;

        try {
          const body = (await response.json()) as { code?: unknown };
          errorCode = typeof body.code === "string" ? body.code : null;
        } catch {
          errorCode = null;
        }

        if (errorCode === "STALE_TOURNAMENT") {
          setError(t("staleTournamentState"));
          await onUpdated?.();
          return;
        }

        throw new Error(t("unableToUpdateMatch"));
      }

      await onUpdated?.();
    } catch {
      setError(t("unableToUpdateMatch"));
    } finally {
      setBusyMatchId(null);
    }
  }

  function renderSlotParticipant(
    match: IMatch,
    side: "A" | "B",
    readOnly = false,
  ) {
    const slot = side === "A" ? match.teamA : match.teamB;
    const teamId = slot?.teamId ?? null;
    const teamName = teamId
      ? resolveTeamName(tournament.teams, teamId) ?? t("toBeDetermined")
      : match.isBye
        ? t("bye")
        : t("toBeDetermined");
    const isWinner =
      match.winnerId !== null &&
      teamId !== null &&
      idString(match.winnerId) === idString(teamId);
    const isCurrentPlayer = isCurrentPlayerTeam(
      tournament,
      teamId,
      currentPlayerName,
    );
    const disabled =
      readOnly ||
      !editable ||
      !syncHealthy ||
      !teamId ||
      !match.teamA ||
      !match.teamB ||
      busyMatchId === match._id.toString();
    const tone = isWinner
      ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
      : isCurrentPlayer
        ? "bg-sky-50 text-slate-900 dark:bg-sky-950 dark:text-white"
        : "text-slate-700 dark:text-slate-200";
    const content = (
      <>
        <TeamCrest editable={false} size={16} teamId={teamId} />
        <span className="truncate">{teamName}</span>
      </>
    );
    const className = `inline-flex max-w-[8rem] items-center rounded px-1.5 py-0.5 font-medium transition ${tone} ${
      disabled
        ? "cursor-default"
        : "hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40"
    }`;

    if (readOnly) {
      return <span className={className}>{content}</span>;
    }

    return (
      <button
        aria-label={`Select ${teamName} as winner`}
        className={className}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          if (teamId) {
            void selectWinner(match, teamId.toString());
          }
        }}
        type="button"
      >
        {content}
      </button>
    );
  }

  function renderSlotMatch(match: IMatch, readOnly = false) {
    const className = `flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm transition dark:border-slate-700 dark:bg-slate-900 ${
      readOnly
        ? "opacity-80"
        : "cursor-pointer hover:border-slate-400 dark:hover:border-slate-500"
    }`;
    const content = (
      <>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-900"
          style={{ backgroundColor: disciplineColor(match.eventDisciplineIndex ?? 0) }}
        >
          {match.eventDisciplineName ?? ""}
        </span>
        {renderSlotParticipant(match, "A", readOnly)}
        <span className="shrink-0 text-slate-400">{t("versus")}</span>
        {renderSlotParticipant(match, "B", readOnly)}
      </>
    );

    if (readOnly) {
      return (
        <article className={className} key={match._id.toString()}>
          {content}
        </article>
      );
    }

    return (
      <article
        className={className}
        key={match._id.toString()}
        onClick={() => jumpToMatch(match)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            jumpToMatch(match);
          }
        }}
        role="button"
        tabIndex={0}
        title={t("viewInBracket")}
      >
        {content}
      </article>
    );
  }

  function renderBracketRow(match: IMatch, side: "A" | "B") {
    if (match.isBye && side === "B") {
      return (
        <div className="flex min-h-[26px] items-center gap-2 border-t border-slate-100 px-2 py-1 text-xs dark:border-slate-800">
          <span className="rounded-full border border-dashed border-slate-300 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-600 dark:text-slate-500">
            {t("bye")}
          </span>
        </div>
      );
    }

    const slot = side === "A" ? match.teamA : match.teamB;
    const teamId = slot?.teamId ?? null;
    const team = teamId ? teamById.get(idString(teamId)) : undefined;
    const teamName = teamId
      ? team?.name ?? resolveTeamName(tournament.teams, teamId) ?? t("toBeDetermined")
      : t("toBeDetermined");
    const isWinner =
      match.winnerId !== null &&
      teamId !== null &&
      idString(match.winnerId) === idString(teamId);
    const isLoser = match.winnerId !== null && teamId !== null && !isWinner;
    const isCurrentPlayer = isCurrentPlayerTeam(
      tournament,
      teamId,
      currentPlayerName,
    );
    const canPick =
      editable &&
      !match.isBye &&
      Boolean(match.teamA) &&
      Boolean(match.teamB) &&
      Boolean(teamId) &&
      busyMatchId !== match._id.toString();
    const tone = isWinner
      ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
      : isLoser
        ? "text-slate-400 line-through dark:text-slate-600"
        : isCurrentPlayer
          ? "bg-sky-50 text-slate-900 dark:bg-sky-950 dark:text-white"
          : "text-slate-700 dark:text-slate-200";
    const className = `flex min-h-[26px] w-full items-center gap-2 px-2 py-1 text-xs transition ${
      side === "A" ? "border-b border-slate-100 dark:border-slate-800" : ""
    } ${tone} ${
      canPick
        ? "cursor-pointer hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40"
        : ""
    }`;
    const inner = (
      <>
        <TeamCrest editable={false} size={16} teamId={teamId} />
        <span className="flex-1 truncate">{teamName}</span>
        {isWinner ? (
          <span className="text-emerald-600 dark:text-emerald-400">✓</span>
        ) : null}
      </>
    );

    if (canPick) {
      return (
        <button
          aria-label={`Select ${teamName} as winner`}
          className={`${className} text-left`}
          disabled={busyMatchId === match._id.toString()}
          onClick={() => {
            if (teamId) {
              void selectWinner(match, teamId.toString());
            }
          }}
          type="button"
        >
          {inner}
        </button>
      );
    }

    return <div className={className}>{inner}</div>;
  }

  function renderBracketTree(group: DisciplineGroup) {
    const roundCount = group.matches.reduce(
      (max, match) => Math.max(max, match.round),
      1,
    );
    const bracketSize = 2 ** roundCount;
    const rowHeight = bracketSize > 16 ? 28 : 34;
    const matchWidth = 150;
    const joinerWidth = 26;
    const columns: string[] = [];

    for (let round = 0; round < roundCount; round += 1) {
      columns.push(`${matchWidth}px`);

      if (round < roundCount - 1) {
        columns.push(`${joinerWidth}px`);
      }
    }

    const minWidth =
      roundCount * matchWidth + Math.max(roundCount - 1, 0) * joinerWidth;
    const championMatch = group.matches.find(
      (match) => match.round === roundCount && match.position === 1,
    );
    const championId = championMatch?.winnerId ?? null;
    const championTeam = championId
      ? teamById.get(idString(championId))
      : undefined;
    const color = disciplineColor(group.index);
    const joinerClass = "absolute border-slate-300 dark:border-slate-700";

    return (
      <div>
        <div
          className="mb-3 inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 dark:border-slate-700"
          style={{
            borderColor: championTeam ? color : undefined,
            backgroundColor: championTeam ? `${color}1f` : undefined,
          }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400"
            style={{ color: championTeam ? color : undefined }}
          >
            {championTeam ? t("eventChampion") : t("titleOpen")}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {championTeam ? championTeam.name : "–"}
          </span>
        </div>
        <div className="overflow-x-auto pb-2">
          <div
            className="grid"
            style={{
              gridTemplateColumns: columns.join(" "),
              gridTemplateRows: `22px repeat(${bracketSize}, ${rowHeight}px)`,
              width: `${minWidth}px`,
            }}
          >
          {Array.from({ length: roundCount }, (_value, round) => (
            <div
              className="self-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
              key={`label-${round}`}
              style={{ gridColumn: 2 * round + 1, gridRow: 1 }}
            >
              {roundName(round, bracketSize)}
            </div>
          ))}

          {group.matches.map((match) => {
            const roundIndex = match.round - 1;
            const span = 2 ** match.round;
            const row = 2 + (match.position - 1) * span;
            const live =
              !match.isBye && match.teamA && match.teamB && !match.winnerId;
            const isHighlighted =
              match._id.toString() === highlightedMatchId;

            return (
              <article
                className={`relative z-10 self-center overflow-hidden rounded-md border bg-white shadow-sm dark:bg-slate-900 ${
                  isHighlighted
                    ? "border-sky-400 ring-2 ring-sky-400 ring-offset-1 dark:border-sky-500 dark:ring-sky-500"
                    : live
                      ? "border-emerald-400 dark:border-emerald-700"
                      : "border-slate-200 dark:border-slate-700"
                }`}
                key={match._id.toString()}
                ref={isHighlighted ? highlightedRef : undefined}
                style={{
                  gridColumn: 2 * roundIndex + 1,
                  gridRow: `${row} / span ${span}`,
                }}
              >
                {renderBracketRow(match, "A")}
                {renderBracketRow(match, "B")}
              </article>
            );
          })}

          {Array.from({ length: Math.max(roundCount - 1, 0) }, (_value, round) => {
            const count = bracketSize >> (round + 2);
            const span = 1 << (round + 2);

            return Array.from({ length: count }, (_inner, joinerIndex) => (
              <div
                className="pointer-events-none relative"
                key={`joiner-${round}-${joinerIndex}`}
                style={{
                  gridColumn: 2 * round + 2,
                  gridRow: `${2 + joinerIndex * span} / span ${span}`,
                }}
              >
                <div
                  className={joinerClass}
                  style={{
                    left: 0,
                    right: "50%",
                    top: "25%",
                    bottom: "25%",
                    borderTopWidth: 1.5,
                    borderBottomWidth: 1.5,
                    borderRightWidth: 1.5,
                    borderRadius: "0 4px 4px 0",
                  }}
                />
                <div
                  className={joinerClass}
                  style={{
                    left: "50%",
                    right: 0,
                    top: "50%",
                    borderTopWidth: 1.5,
                  }}
                />
              </div>
            ));
          })}

          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6" data-testid="event-tournament-view">
      {error ? (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}

      <section>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("eventOverview")}
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {disciplineGroups.map((group) => {
            const playableMatches = group.matches.filter((match) => !match.isBye);
            const completedMatches = playableMatches.filter(
              (match) => match.status === "completed",
            );
            const color = disciplineColor(group.index);

            return (
              <article
                className="flex-1 basis-40 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                key={group.index}
                style={{ borderTop: `3px solid ${color}` }}
              >
                <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{group.name}</span>
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {t("completedNonByeMatches")}: {completedMatches.length}/
                  {playableMatches.length}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <div className="mx-auto w-fit max-w-full space-y-6">
        <section>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("upNext")}
          </h2>
          <div className="mt-4 space-y-4">
            <section data-testid="event-current-matches">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  {t("currentMatches")}
                </h3>
                {nextSlot ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {t("slot")} {nextSlot.index}
                  </span>
                ) : null}
              </div>
              {nextSlot ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {nextSlot.matches.map((match) => renderSlotMatch(match))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  {t("noPlayableEventMatches")}
                </p>
              )}
            </section>
            {recalculatedNextSlots.length > 0 ? (
              <section data-testid="event-recalculated-next-matches">
                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  {t("recalculatedNextMatches")}
                </h3>
                <div className="mt-3 space-y-3">
                  {recalculatedNextSlots.map((slot) => (
                    <div key={slot.index}>
                      <span className="mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {t("slot")} {slot.index}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {slot.matches.map((match) => renderSlotMatch(match, true))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("eventBrackets")}
          </h2>
          {disciplineGroups.length > 0 ? (
            <div className="mt-4 lg:flex lg:items-start lg:gap-24">
              <div className="min-w-0">
                <div
                  aria-label={t("eventBrackets")}
                  className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700"
                  role="tablist"
                >
                {disciplineGroups.map((group, index) => {
                  const isActive = index === selectedDisciplineIndex;

                  return (
                    <button
                      aria-selected={isActive}
                      className={`flex items-center gap-2 rounded-t-md px-4 py-2 text-sm font-semibold ${
                        isActive
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                      key={group.index}
                      onClick={() => setActiveDiscipline(index)}
                      role="tab"
                      type="button"
                    >
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: disciplineColor(group.index) }}
                      />
                      {group.name}
                    </button>
                  );
                })}
              </div>
              {selectedGroup ? (
                <div className="mt-4" role="tabpanel">
                  {renderBracketTree(selectedGroup)}
                </div>
              ) : null}
            </div>
              <div className="mt-8 lg:mt-0 lg:flex-none">
                <TournamentStats tournament={tournament} />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
