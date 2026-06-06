"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  assignPlayersToEqualTeams,
  assignPlayersToTeams,
} from "@/lib/bracket/playerAssign";
import { useLocale } from "@/components/ui/LocaleProvider";

export interface SetupTeam {
  name: string;
  players: string[];
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
  const joinedPlayerNames = (tournament.joinedPlayers ?? []).map(
    (player) => player.displayName,
  );
  const [teamNames, setTeamNames] = useState<string[]>(
    tournament.teams.length > 0
      ? tournament.teams.map((team) => team.name)
      : ["", ""],
  );
  const [playerNames, setPlayerNames] = useState<string[]>(
    tournament.teams.length > 0
      ? tournament.teams.flatMap((team) => team.players)
      : joinedPlayerNames.length > 0
        ? joinedPlayerNames
        : ["", ""],
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

    setPlayerNames((current) => {
      const currentNames = new Set(
        current.map((playerName) => playerName.trim()).filter(Boolean),
      );
      const newJoinedNames = joinedPlayerNames.filter(
        (playerName) => !currentNames.has(playerName),
      );

      return newJoinedNames.length > 0 ? [...current, ...newJoinedNames] : current;
    });
  }, [joinedPlayerNames, tournament.inputMode]);

  const enteredPlayerNames = playerNames
    .map((player) => player.trim())
    .filter(Boolean);
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
    setPlayerNames((current) =>
      current.map((value, currentIndex) => (currentIndex === index ? name : value)),
    );
  }

  function generateTeams() {
    setError(null);

    try {
      setPreviewTeams(
        (isTeamRoundRobin
          ? assignPlayersToEqualTeams(enteredPlayerNames, tournament.teamSize)
          : assignPlayersToTeams(enteredPlayerNames, tournament.teamSize)
        ).map((team) => ({
          name: team.name,
          players: team.players,
          seed: team.seed,
        })),
      );
    } catch (assignmentError) {
      setPreviewTeams([]);
      setError(
        assignmentError instanceof Error
          ? assignmentError.message
          : "Unable to generate teams.",
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
        return enteredPlayerNames.map((name, index) => ({
          name,
          players: [name],
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
      setError(`Enter at least ${tournament.teamSize * 2} players.`);
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
        setError("Generate at least two named teams.");
        return;
      }
    }

    if (teams.length < 2 || teams.some((team) => team.name.length === 0)) {
      setError(
        tournament.inputMode === "teams"
          ? "Enter at least two team names."
          : "Generate at least two named teams.",
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
            "Unable to save tournament teams.",
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
          await getApiErrorMessage(startResponse, "Unable to start tournament."),
        );
        return;
      }

      router.push(`/admin/tournament/${tournament._id}/manage`);
      router.refresh();
    } catch {
      setError("Unable to start tournament.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">
        {locale === "de" ? `${tournament.name} ${t("setup")}` : `Set up ${tournament.name}`}
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Add participants and confirm the teams before starting the tournament.
      </p>

      {tournament.inputMode === "teams" ? (
        <div className="mt-8 space-y-3">
          {teamNames.map((teamName, index) => (
            <div className="flex gap-2" key={index}>
              <label className="flex-1">
                <span className="sr-only">Team {index + 1} name</span>
                <input
                  aria-label={`Team ${index + 1} name`}
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
                Remove
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
                Joined players
              </h2>
              <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {(tournament.joinedPlayers ?? []).map((player) => (
                  <li key={player.userId}>{player.displayName}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <div className="space-y-3">
            {playerNames.map((playerName, index) => (
              <div className="flex gap-2" key={index}>
                <label className="flex-1">
                  <span className="sr-only">{t("player")} {index + 1} {t("name")}</span>
                  <input
                    aria-label={`Player ${index + 1} name`}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
                    onChange={(event) =>
                      updatePlayerName(index, event.target.value)
                    }
                    placeholder={`${t("player")} ${index + 1}`}
                    value={playerName}
                  />
                </label>
                <button
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
                  disabled={playerNames.length <= 1}
                  onClick={() =>
                    setPlayerNames((current) =>
                      current.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    )
                  }
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-3">
            <button
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-600"
              onClick={() => setPlayerNames((current) => [...current, ""])}
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
              Some players will be added to the last team.
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
                  Shuffle teams
                </button>
              </div>
              {previewTeams.map((team, index) => (
                <div
                  className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                  key={index}
                >
                  <input
                    aria-label={`Preview team ${index + 1} name`}
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
        {isSubmitting ? "Starting..." : t("startTournament")}
      </button>
    </section>
  );
}

