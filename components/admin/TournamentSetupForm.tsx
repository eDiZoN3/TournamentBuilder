"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RegisteredPlayerPicker,
  type RegisteredPlayerOption,
} from "@/components/player/RegisteredPlayerPicker";
import {
  assignRosterPlayersToEqualTeams,
  assignRosterPlayersToTeams,
} from "@/lib/bracket/playerAssign";
import { useLocale } from "@/components/ui/LocaleProvider";
import { useFocusTrap } from "@/components/ui/useFocusTrap";
import { formatTranslation } from "@/lib/i18n";

export interface SetupTeam {
  name: string;
  players: string[];
  playerProfileIds?: Array<string | null>;
  seed: number;
}

export interface SetupJoinedPlayer {
  userId: string;
  playerProfileId: string;
  firstName: string;
  surname?: string;
  displayName: string;
  email: string;
  joinedAt: string;
}

interface SetupPlayerEntry {
  displayName: string;
  playerProfileId?: string | null;
}

export interface SetupTournament {
  _id: string;
  name: string;
  format?: "double_elimination" | "team_round_robin" | "individual_mixer" | "event";
  teamSize: number;
  inputMode: "teams" | "players";
  allowSelfJoin?: boolean;
  eventParticipantCount?: number;
  eventDisciplineCount?: number;
  eventDisciplines?: string[];
  joinedPlayers?: SetupJoinedPlayer[];
  teams: SetupTeam[];
}

interface TournamentSetupFormProps {
  tournament: SetupTournament;
}

interface ApiError {
  error?: string;
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const name of names) {
    const normalizedName = name.trim().replace(/\s+/g, " ");
    const key = normalizedName.toLowerCase();

    if (!normalizedName || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(normalizedName);
  }

  return unique;
}

function teamPlayerEntries(teams: SetupTeam[]): SetupPlayerEntry[] {
  return teams.flatMap((team) =>
    team.players.map((player, index) => ({
      displayName: player,
      playerProfileId: team.playerProfileIds?.[index] ?? null,
    })),
  );
}

function joinedPlayerEntries(players: SetupJoinedPlayer[]): SetupPlayerEntry[] {
  return players.map((player) => ({
    displayName: player.displayName,
    playerProfileId: player.playerProfileId,
  }));
}

function blankPlayerEntries(): SetupPlayerEntry[] {
  return [{ displayName: "" }, { displayName: "" }];
}

export async function getApiErrorMessage(
  response: Response,
  fallback: string,
) {
  try {
    const body = (await response.json()) as ApiError;
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function TournamentSetupForm({
  tournament,
}: TournamentSetupFormProps) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const format = tournament.format ?? "double_elimination";
  const isTeamRoundRobin = format === "team_round_robin";
  const isIndividualMixer = format === "individual_mixer";
  const isEventTournament = format === "event";
  const eventParticipantCount = tournament.eventParticipantCount ?? 2;
  const eventDisciplineCount = tournament.eventDisciplineCount ?? 1;
  const joinedPlayers = tournament.joinedPlayers;
  const joinedPlayerNames = useMemo(
    () => (joinedPlayers ?? []).map((player) => player.displayName),
    [joinedPlayers],
  );
  const joinedEntries = useMemo(
    () => joinedPlayerEntries(joinedPlayers ?? []),
    [joinedPlayers],
  );
  // Stable row ids keep controlled inputs bound to the right row when a middle
  // row is removed via filter (using the array index as a key would otherwise
  // shift the typed value onto the wrong row).
  const rowIdCounter = useRef(0);
  const nextRowId = () => {
    rowIdCounter.current += 1;
    return `row-${rowIdCounter.current}`;
  };
  const makeRowIds = (count: number) =>
    Array.from({ length: count }, () => nextRowId());
  const [teamNames, setTeamNames] = useState<string[]>(
    tournament.teams.length > 0
      ? tournament.teams.map((team) => team.name)
      : ["", ""],
  );
  const [playerEntries, setPlayerEntries] = useState<SetupPlayerEntry[]>(
    tournament.teams.length > 0
      ? teamPlayerEntries(tournament.teams)
      : joinedEntries.length > 0
        ? joinedEntries
        : blankPlayerEntries(),
  );
  const [teamNameIds, setTeamNameIds] = useState<string[]>(() =>
    makeRowIds(
      tournament.teams.length > 0 ? tournament.teams.length : 2,
    ),
  );
  const [playerEntryIds, setPlayerEntryIds] = useState<string[]>(() =>
    makeRowIds(
      tournament.teams.length > 0
        ? teamPlayerEntries(tournament.teams).length
        : joinedEntries.length > 0
          ? joinedEntries.length
          : blankPlayerEntries().length,
    ),
  );
  const [previewTeams, setPreviewTeams] = useState<SetupTeam[]>(
    tournament.inputMode === "players" &&
      !isIndividualMixer &&
      tournament.teams.every((team) => team.players.length >= tournament.teamSize)
      ? tournament.teams
      : [],
  );
  const [eventParticipantNames, setEventParticipantNames] = useState<string[]>(
    tournament.teams.length > 0
      ? tournament.teams.map((team) => team.name).slice(0, eventParticipantCount)
      : Array.from({ length: eventParticipantCount }, () => ""),
  );
  const [eventDisciplineNames, setEventDisciplineNames] = useState<string[]>(
    (tournament.eventDisciplines ?? []).length > 0
      ? (tournament.eventDisciplines ?? []).slice(0, eventDisciplineCount)
      : Array.from({ length: eventDisciplineCount }, () => ""),
  );
  const [pendingPlaceholders, setPendingPlaceholders] = useState<
    string[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSavingRoster, setIsSavingRoster] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (tournament.inputMode !== "players" || joinedPlayerNames.length === 0) {
      return;
    }

    setPlayerEntries((current) => {
      const currentProfileIds = new Set(
        current
          .map((player) => player.playerProfileId)
          .filter((id): id is string => Boolean(id)),
      );
      const currentNames = new Set(
        current
          .map((player) => player.displayName.trim().toLowerCase())
          .filter(Boolean),
      );
      const newJoinedPlayers = joinedEntries.filter(
        (player) =>
          !currentProfileIds.has(player.playerProfileId ?? "") &&
          !currentNames.has(player.displayName.trim().toLowerCase()),
      );

      if (newJoinedPlayers.length === 0) {
        return current;
      }

      setPlayerEntryIds((currentIds) => [
        ...currentIds,
        ...makeRowIds(newJoinedPlayers.length),
      ]);

      return [...current, ...newJoinedPlayers];
    });
    // makeRowIds is a stable closure over a ref and intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinedEntries, joinedPlayerNames.length, tournament.inputMode]);

  useEffect(() => {
    if (
      !isEventTournament ||
      tournament.inputMode !== "players" ||
      joinedPlayerNames.length === 0
    ) {
      return;
    }

    setEventParticipantNames((current) => {
      const filled = [...current];
      const taken = new Set(
        filled.map((name) => name.trim().toLowerCase()).filter(Boolean),
      );
      let changed = false;

      for (const name of joinedPlayerNames) {
        const key = name.trim().toLowerCase();

        if (!key || taken.has(key)) {
          continue;
        }

        const emptySlot = filled.findIndex((value) => value.trim().length === 0);

        if (emptySlot === -1) {
          break;
        }

        filled[emptySlot] = name;
        taken.add(key);
        changed = true;
      }

      return changed ? filled : current;
    });
  }, [isEventTournament, joinedPlayerNames, tournament.inputMode]);

  // Placeholder labels used both as input placeholders and as the default
  // values applied when a field is left blank.
  const teamPlaceholder = (index: number) => `${t("team")} ${index + 1}`;
  const playerPlaceholder = (index: number) => `${t("player")} ${index + 1}`;
  const participantPlaceholder = (index: number) =>
    `${t("participants")} ${index + 1}`;
  const disciplinePlaceholder = (index: number) =>
    `${t("discipline")} ${index + 1}`;

  const playerNames = playerEntries.map((player) => player.displayName);
  const selectedPlayerProfileIds = playerEntries
    .map((player) => player.playerProfileId)
    .filter((id): id is string => Boolean(id));

  const enteredPlayerNames = playerNames
    .map((player) => player.trim())
    .filter(Boolean);
  const enteredPlayerEntries = playerEntries
    .map((player) => ({
      displayName: player.displayName.trim(),
      playerProfileId: player.playerProfileId ?? null,
    }))
    .filter((player) => Boolean(player.displayName));
  const exactPlayerNames = uniqueNames(enteredPlayerNames);
  const hasPlayerRemainder =
    !isIndividualMixer &&
    enteredPlayerNames.length > 0 &&
    (isTeamRoundRobin ? exactPlayerNames : enteredPlayerNames).length %
      tournament.teamSize !==
      0;

  function updateTeamName(index: number, name: string) {
    setStatusMessage(null);
    setTeamNames((current) =>
      current.map((value, currentIndex) => (currentIndex === index ? name : value)),
    );
  }

  function updatePlayerName(index: number, name: string) {
    setStatusMessage(null);
    setPlayerEntries((current) =>
      current.map((value, currentIndex) =>
        currentIndex === index
          ? {
              displayName: name,
              playerProfileId: null,
            }
          : value,
      ),
    );
  }

  function updateEventParticipantName(index: number, name: string) {
    setStatusMessage(null);
    setEventParticipantNames((current) => {
      const next = Array.from(
        { length: eventParticipantCount },
        (_value, currentIndex) => current[currentIndex] ?? "",
      );

      next[index] = name;
      return next;
    });
  }

  function updateEventDisciplineName(index: number, name: string) {
    setStatusMessage(null);
    setEventDisciplineNames((current) => {
      const next = Array.from(
        { length: eventDisciplineCount },
        (_value, currentIndex) => current[currentIndex] ?? "",
      );

      next[index] = name;
      return next;
    });
  }

  function addRegisteredPlayer(player: RegisteredPlayerOption) {
    setStatusMessage(null);
    setPlayerEntries((current) => {
      if (
        current.some(
          (entry) =>
            entry.playerProfileId === player._id ||
            entry.displayName.trim().toLowerCase() ===
              player.displayName.trim().toLowerCase(),
        )
      ) {
        return current;
      }

      setPlayerEntryIds((currentIds) => [...currentIds, nextRowId()]);

      return [
        ...current,
        {
          displayName: player.displayName,
          playerProfileId: player._id,
        },
      ];
    });
  }

  function generateTeams() {
    setError(null);
    setStatusMessage(null);

    try {
      setPreviewTeams(
        (isTeamRoundRobin
          ? assignRosterPlayersToEqualTeams(
              enteredPlayerEntries,
              tournament.teamSize,
            )
          : assignRosterPlayersToTeams(enteredPlayerEntries, tournament.teamSize)
        ).map((team) => ({
          name: team.name,
          players: team.players,
          playerProfileIds: team.playerProfileIds?.map((id) =>
            id ? id.toString() : null,
          ),
          seed: team.seed,
        })),
      );
    } catch (assignmentError) {
      setPreviewTeams([]);
      setError(
        assignmentError instanceof Error
          ? assignmentError.message
          : t("unableToGenerateTeams"),
      );
    }
  }

  function updatePreviewName(index: number, name: string) {
    setStatusMessage(null);
    setPreviewTeams((current) =>
      current.map((team, currentIndex) =>
        currentIndex === index
          ? {
              ...team,
              name,
            }
          : team,
      ),
    );
  }

  function playerEntryTeams(): SetupTeam[] {
    return enteredPlayerEntries.map((player, index) => ({
      name: player.displayName,
      players: [player.displayName],
      ...(player.playerProfileId
        ? { playerProfileIds: [player.playerProfileId] }
        : {}),
      seed: index + 1,
    }));
  }

  function eventParticipantTeams(): SetupTeam[] {
    return eventParticipantNames.map((name, index) => {
      const trimmedName = name.trim();

      return {
        name: trimmedName,
        players: tournament.inputMode === "players" ? [trimmedName] : [],
        seed: index + 1,
      };
    });
  }

  function eventDisciplineEntries(): string[] {
    return Array.from({ length: eventDisciplineCount }, (_value, index) => {
      const trimmedName = (eventDisciplineNames[index] ?? "").trim();

      return trimmedName.length > 0 ? trimmedName : disciplinePlaceholder(index);
    });
  }

  // Save-path builders: blank fields fall back to their placeholder label so
  // the placeholder acts as the default value.
  function namedTeamEntriesFilled(): SetupTeam[] {
    return teamNames.map((name, index) => ({
      name: name.trim() || teamPlaceholder(index),
      players: [],
      seed: 0,
    }));
  }

  function playerEntryTeamsFilled(): SetupTeam[] {
    return playerEntries.map((player, index) => {
      const name = player.displayName.trim() || playerPlaceholder(index);

      return {
        name,
        players: [name],
        ...(player.playerProfileId
          ? { playerProfileIds: [player.playerProfileId] }
          : {}),
        seed: index + 1,
      };
    });
  }

  function eventParticipantTeamsFilled(): SetupTeam[] {
    return Array.from({ length: eventParticipantCount }, (_value, index) => {
      const name =
        (eventParticipantNames[index] ?? "").trim() ||
        participantPlaceholder(index);

      return {
        name,
        players: tournament.inputMode === "players" ? [name] : [],
        seed: index + 1,
      };
    });
  }

  function draftRosterTeamsFilled(): SetupTeam[] {
    if (isEventTournament) {
      return eventParticipantTeamsFilled();
    }

    if (tournament.inputMode === "teams") {
      return namedTeamEntriesFilled();
    }

    if (isIndividualMixer || previewTeams.length === 0) {
      return playerEntryTeamsFilled();
    }

    return previewTeamEntries();
  }

  // Placeholder values that would be applied for blank fields in the current
  // view (empty when everything has been filled in manually).
  function placeholderUsage(): string[] {
    const labels: string[] = [];

    if (isEventTournament) {
      for (let index = 0; index < eventParticipantCount; index += 1) {
        if (!(eventParticipantNames[index] ?? "").trim()) {
          labels.push(participantPlaceholder(index));
        }
      }

      for (let index = 0; index < eventDisciplineCount; index += 1) {
        if (!(eventDisciplineNames[index] ?? "").trim()) {
          labels.push(disciplinePlaceholder(index));
        }
      }

      return labels;
    }

    if (tournament.inputMode === "teams") {
      teamNames.forEach((name, index) => {
        if (!name.trim()) {
          labels.push(teamPlaceholder(index));
        }
      });

      return labels;
    }

    // Player mode: when teams have been generated the saved roster uses the
    // (already named) preview teams, so blank player rows are irrelevant.
    if (!isIndividualMixer && previewTeams.length > 0) {
      return labels;
    }

    playerEntries.forEach((player, index) => {
      if (!player.displayName.trim()) {
        labels.push(playerPlaceholder(index));
      }
    });

    return labels;
  }

  function namedTeamEntries(): SetupTeam[] {
    return teamNames
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        players: [],
        seed: 0,
      }));
  }

  function previewTeamEntries(): SetupTeam[] {
    return previewTeams.map((team) => ({
      ...team,
      name: team.name.trim(),
    }));
  }

  function startRosterTeams(): SetupTeam[] {
    if (isEventTournament) {
      return eventParticipantTeams();
    }

    if (tournament.inputMode === "teams") {
      return namedTeamEntries();
    }

    return isIndividualMixer ? playerEntryTeams() : previewTeamEntries();
  }

  async function saveTournamentTeams(teams: SetupTeam[]) {
    const updateResponse = await fetch(`/api/tournaments/${tournament._id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(
        isEventTournament
          ? {
              teams,
              eventDisciplines: eventDisciplineEntries(),
            }
          : { teams },
      ),
    });

    if (!updateResponse.ok) {
      setError(
        await getApiErrorMessage(
          updateResponse,
          t("unableToSaveTournamentTeams"),
        ),
      );
      return false;
    }

    return true;
  }

  async function performSaveRoster() {
    setError(null);
    setStatusMessage(null);
    setIsSavingRoster(true);

    try {
      if (await saveTournamentTeams(draftRosterTeamsFilled())) {
        setStatusMessage(t("rosterSaved"));
        router.refresh();
      }
    } catch {
      setError(t("unableToSaveTournamentTeams"));
    } finally {
      setIsSavingRoster(false);
    }
  }

  async function saveRoster() {
    const usage = placeholderUsage();

    if (usage.length > 0) {
      setError(null);
      setStatusMessage(null);
      setPendingPlaceholders(usage);
      return;
    }

    await performSaveRoster();
  }

  async function confirmSaveWithPlaceholders() {
    setPendingPlaceholders(null);
    await performSaveRoster();
  }

  async function startTournament() {
    setError(null);
    setStatusMessage(null);

    const teams = startRosterTeams();

    if (isEventTournament) {
      const disciplines = eventDisciplineEntries();

      if (
        teams.length !== eventParticipantCount ||
        teams.some((team) => team.name.length === 0)
      ) {
        setError(t("enterAtLeastTwoTeamNames"));
        return;
      }

      if (
        disciplines.length !== eventDisciplineCount ||
        disciplines.some((discipline) => discipline.trim().length === 0)
      ) {
        setError(t("unableToSaveTournamentTeams"));
        return;
      }
    }

    if (
      isIndividualMixer &&
      enteredPlayerNames.length < tournament.teamSize * 2
    ) {
      setError(
        formatTranslation(locale, "enterMinPlayers", {
          n: tournament.teamSize * 2,
        }),
      );
      return;
    }

    if (isTeamRoundRobin && tournament.inputMode === "players") {
      if (
        exactPlayerNames.length === 0 ||
        exactPlayerNames.length % tournament.teamSize !== 0
      ) {
        setError(t("exactPlayerCountRequirement"));
        return;
      }

      if (
        previewTeams.length < 2 ||
        previewTeams.some(
          (team) =>
            team.name.trim().length === 0 ||
            team.players.length !== tournament.teamSize,
        )
      ) {
        setError(t("generateMinTeams"));
        return;
      }
    }

    if (
      tournament.inputMode === "players" &&
      !isIndividualMixer &&
      !isTeamRoundRobin &&
      !isEventTournament &&
      (previewTeams.length < 2 ||
        previewTeams.some(
          (team) =>
            team.name.trim().length === 0 ||
            team.players.length < tournament.teamSize,
        ))
    ) {
      setError(t("generateMinTeams"));
      return;
    }

    if (teams.length < 2 || teams.some((team) => team.name.length === 0)) {
      setError(
        tournament.inputMode === "teams"
          ? t("enterAtLeastTwoTeamNames")
          : t("generateMinTeams"),
      );
      return;
    }

    setIsStarting(true);

    try {
      if (!(await saveTournamentTeams(teams))) {
        return;
      }

      const startResponse = await fetch(
        `/api/tournaments/${tournament._id}/start`,
        {
          method: "POST",
        },
      );

      if (!startResponse.ok) {
        setError(
          await getApiErrorMessage(startResponse, t("unableToStartTournament")),
        );
        return;
      }

      router.push(`/admin/tournament/${tournament._id}/manage`);
      router.refresh();
    } catch {
      setError(t("unableToStartTournament"));
    } finally {
      setIsStarting(false);
    }
  }

  const isBusy = isSavingRoster || isStarting;

  const placeholderDialogRef = useRef<HTMLDivElement | null>(null);
  const isPlaceholderDialogOpen = Boolean(
    pendingPlaceholders && pendingPlaceholders.length > 0,
  );

  useFocusTrap(placeholderDialogRef, isPlaceholderDialogOpen, () =>
    setPendingPlaceholders(null),
  );

  const placeholderDialog =
    pendingPlaceholders && pendingPlaceholders.length > 0 ? (
      <div
        aria-modal="true"
        className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40"
        ref={placeholderDialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <p className="font-semibold text-amber-900 dark:text-amber-200">
          {t("useDefaultsTitle")}
        </p>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
          {formatTranslation(locale, "useDefaultsBody", {
            values: pendingPlaceholders.join(", "),
          })}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            disabled={isBusy}
            onClick={confirmSaveWithPlaceholders}
            type="button"
          >
            {t("useDefaultsConfirm")}
          </button>
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
            disabled={isBusy}
            onClick={() => setPendingPlaceholders(null)}
            type="button"
          >
            {t("useDefaultsCancel")}
          </button>
        </div>
      </div>
    ) : null;

  if (isEventTournament) {
    const participantValues = Array.from(
      { length: eventParticipantCount },
      (_value, index) => eventParticipantNames[index] ?? "",
    );
    const disciplineValues = Array.from(
      { length: eventDisciplineCount },
      (_value, index) => eventDisciplineNames[index] ?? "",
    );

    return (
      <section className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">
          {formatTranslation(locale, "setupTournamentTitle", {
            name: tournament.name,
          })}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {t("eventSetupDescription")}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("participants")}
            </h2>
            <div className="mt-3 space-y-3">
              {participantValues.map((participantName, index) => (
                <label className="block" key={index}>
                  <span className="sr-only">
                    {formatTranslation(locale, "participantNameField", {
                      n: index + 1,
                    })}
                  </span>
                  <input
                    aria-label={formatTranslation(
                      locale,
                      "participantNameField",
                      { n: index + 1 },
                    )}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
                    maxLength={50}
                    onChange={(event) =>
                      updateEventParticipantName(index, event.target.value)
                    }
                    placeholder={`${t("participants")} ${index + 1}`}
                    value={participantName}
                  />
                </label>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("disciplines")}
            </h2>
            <div className="mt-3 space-y-3">
              {disciplineValues.map((disciplineName, index) => (
                <label className="block" key={index}>
                  <span className="sr-only">
                    {formatTranslation(locale, "disciplineNameField", {
                      n: index + 1,
                    })}
                  </span>
                  <input
                    aria-label={formatTranslation(
                      locale,
                      "disciplineNameField",
                      { n: index + 1 },
                    )}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
                    maxLength={80}
                    onChange={(event) =>
                      updateEventDisciplineName(index, event.target.value)
                    }
                    placeholder={`${t("discipline")} ${index + 1}`}
                    value={disciplineName}
                  />
                </label>
              ))}
            </div>
          </section>
        </div>

        {error ? (
          <p className="mt-4 text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {statusMessage ? (
          <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {statusMessage}
          </p>
        ) : null}

        {placeholderDialog}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
            disabled={isBusy}
            onClick={saveRoster}
            type="button"
          >
            {isSavingRoster ? t("saving") : t("saveRoster")}
          </button>
          <button
            className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            disabled={isBusy}
            onClick={startTournament}
            type="button"
          >
            {isStarting ? t("saving") : t("startTournament")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">
        {formatTranslation(locale, "setupTournamentTitle", { name: tournament.name })}
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        {t("addParticipantsNote")}
      </p>

      {tournament.inputMode === "teams" ? (
        <div className="mt-8 space-y-3">
          {teamNames.map((teamName, index) => (
            <div className="flex gap-2" key={teamNameIds[index] ?? index}>
              <label className="flex-1">
                <span className="sr-only">
                  {formatTranslation(locale, "teamNameField", { n: index + 1 })}
                </span>
                <input
                  aria-label={formatTranslation(locale, "teamNameField", {
                    n: index + 1,
                  })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
                  maxLength={50}
                  onChange={(event) => updateTeamName(index, event.target.value)}
                  placeholder={`${t("team")} ${index + 1}`}
                  value={teamName}
                />
              </label>
              <button
                className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
                disabled={teamNames.length <= 2}
                onClick={() => {
                  setStatusMessage(null);
                  setTeamNames((current) =>
                    current.filter((_, currentIndex) => currentIndex !== index),
                  );
                  setTeamNameIds((current) =>
                    current.filter((_, currentIndex) => currentIndex !== index),
                  );
                }}
                type="button"
              >
                {t("remove")}
              </button>
            </div>
          ))}
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-600"
            onClick={() => {
              setStatusMessage(null);
              setTeamNames((current) => [...current, ""]);
              setTeamNameIds((current) => [...current, nextRowId()]);
            }}
            type="button"
          >
            {t("addTeam")}
          </button>
        </div>
      ) : (
        <div className="mt-8">
          {tournament.allowSelfJoin && (tournament.joinedPlayers ?? []).length > 0 ? (
            <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("joinedPlayers")}
              </h2>
              <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {(tournament.joinedPlayers ?? []).map((player) => (
                  <li key={player.userId}>{player.displayName}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <div className="mb-6">
            <RegisteredPlayerPicker
              clearOnSelect={false}
              onSelect={addRegisteredPlayer}
              selectedPlayerIds={selectedPlayerProfileIds}
            />
          </div>
          <div className="space-y-3">
            {playerEntries.map((player, index) => (
              <div className="flex gap-2" key={playerEntryIds[index] ?? index}>
                <label className="flex-1">
                  <span className="sr-only">
                    {formatTranslation(locale, "playerNameField", {
                      n: index + 1,
                    })}
                  </span>
                  <input
                    aria-label={formatTranslation(locale, "playerNameField", {
                      n: index + 1,
                    })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
                    onChange={(event) =>
                      updatePlayerName(index, event.target.value)
                    }
                    placeholder={`${t("player")} ${index + 1}`}
                    value={player.displayName}
                  />
                </label>
                <button
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
                  disabled={playerNames.length <= 1}
                  onClick={() => {
                    setStatusMessage(null);
                    setPlayerEntries((current) =>
                      current.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    );
                    setPlayerEntryIds((current) =>
                      current.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    );
                  }}
                  type="button"
                >
                  {t("remove")}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-3">
            <button
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-600"
              onClick={() => {
                setStatusMessage(null);
                setPlayerEntries((current) => [...current, { displayName: "" }]);
                setPlayerEntryIds((current) => [...current, nextRowId()]);
              }}
              type="button"
            >
              {t("addPlayer")}
            </button>
            {!isIndividualMixer ? (
              <button
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                onClick={generateTeams}
                type="button"
              >
                {t("generateTeams")}
              </button>
            ) : null}
          </div>

          {hasPlayerRemainder && !isTeamRoundRobin ? (
            <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
              {t("playerRemainderWarning")}
            </p>
          ) : null}

          {!isIndividualMixer && previewTeams.length > 0 ? (
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t("teamPreview")}</h2>
                <button
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-600"
                  onClick={generateTeams}
                  type="button"
                >
                  {t("shuffleTeams")}
                </button>
              </div>
              {previewTeams.map((team, index) => (
                <div
                  className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                  key={`${team.seed}-${team.players.join("|")}`}
                >
                  <input
                    aria-label={formatTranslation(locale, "teamPreviewNameField", {
                      n: index + 1,
                    })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 font-medium dark:border-slate-600"
                    maxLength={50}
                    onChange={(event) =>
                      updatePreviewName(index, event.target.value)
                    }
                    value={team.name}
                  />
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {team.players.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {error ? (
        <p className="mt-4 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {statusMessage ? (
        <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {statusMessage}
        </p>
      ) : null}

      {placeholderDialog}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
          disabled={isBusy}
          onClick={saveRoster}
          type="button"
        >
          {isSavingRoster ? t("saving") : t("saveRoster")}
        </button>
        <button
          className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          disabled={isBusy}
          onClick={startTournament}
          type="button"
        >
          {isStarting ? t("saving") : t("startTournament")}
        </button>
      </div>
    </section>
  );
}

