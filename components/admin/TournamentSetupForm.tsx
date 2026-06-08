"use client";

import { useEffect, useMemo, useState } from "react";
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
  format?: "double_elimination" | "team_round_robin" | "individual_mixer";
  teamSize: 2 | 3 | 4;
  inputMode: "teams" | "players";
  allowSelfJoin?: boolean;
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
  const joinedPlayers = tournament.joinedPlayers;
  const joinedPlayerNames = useMemo(
    () => (joinedPlayers ?? []).map((player) => player.displayName),
    [joinedPlayers],
  );
  const joinedEntries = useMemo(
    () => joinedPlayerEntries(joinedPlayers ?? []),
    [joinedPlayers],
  );
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
  const [previewTeams, setPreviewTeams] = useState<SetupTeam[]>(
    tournament.inputMode === "players" ? tournament.teams : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      return newJoinedPlayers.length > 0
        ? [...current, ...newJoinedPlayers]
        : current;
    });
  }, [joinedEntries, joinedPlayerNames.length, tournament.inputMode]);

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
    setTeamNames((current) =>
      current.map((value, currentIndex) => (currentIndex === index ? name : value)),
    );
  }

  function updatePlayerName(index: number, name: string) {
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

  function addRegisteredPlayer(player: RegisteredPlayerOption) {
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

  async function startTournament() {
    setError(null);

    const teams = (() => {
      if (tournament.inputMode === "teams") {
        return teamNames.map((name) => ({
          name: name.trim(),
          players: [],
          seed: 0,
        }));
      }

      if (isIndividualMixer) {
        return enteredPlayerEntries.map((player, index) => ({
          name: player.displayName,
          players: [player.displayName],
          ...(player.playerProfileId
            ? { playerProfileIds: [player.playerProfileId] }
            : {}),
          seed: index + 1,
        }));
      }

      return previewTeams.map((team) => ({
        ...team,
        name: team.name.trim(),
      }));
    })();

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

    if (isTeamRoundRobin) {
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

    if (teams.length < 2 || teams.some((team) => team.name.length === 0)) {
      setError(
        tournament.inputMode === "teams"
          ? t("enterAtLeastTwoTeamNames")
          : t("generateMinTeams"),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const updateResponse = await fetch(`/api/tournaments/${tournament._id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ teams }),
      });

      if (!updateResponse.ok) {
        setError(
          await getApiErrorMessage(
            updateResponse,
            t("unableToSaveTournamentTeams"),
          ),
        );
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
      setIsSubmitting(false);
    }
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
            <div className="flex gap-2" key={index}>
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
                onClick={() =>
                  setTeamNames((current) =>
                    current.filter((_, currentIndex) => currentIndex !== index),
                  )
                }
                type="button"
              >
                {t("remove")}
              </button>
            </div>
          ))}
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-600"
            onClick={() => setTeamNames((current) => [...current, ""])}
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
              <div className="flex gap-2" key={index}>
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
                  onClick={() =>
                    setPlayerEntries((current) =>
                      current.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    )
                  }
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
              onClick={() =>
                setPlayerEntries((current) => [...current, { displayName: "" }])
              }
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
                  key={index}
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

      <button
        className="mt-8 rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        disabled={isSubmitting}
        onClick={startTournament}
        type="button"
      >
        {isSubmitting ? t("saving") : t("startTournament")}
      </button>
    </section>
  );
}

