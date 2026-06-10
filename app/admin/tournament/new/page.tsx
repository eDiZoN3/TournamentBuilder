"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/ui/LocaleProvider";
import type {
  FirstRoundPairingMode,
  KnockoutBracketType,
  KnockoutMatchFormat,
  MatchResultMode,
  RoundRobinMatchFormat,
  TournamentFormat,
} from "@/lib/models/Tournament";

interface ApiError {
  error?: string;
}

export default function NewTournamentPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("double_elimination");
  const [knockoutBracketType, setKnockoutBracketType] =
    useState<KnockoutBracketType>("double_elimination");
  const [firstRoundPairingMode, setFirstRoundPairingMode] =
    useState<FirstRoundPairingMode>("random");
  const [matchResultMode, setMatchResultMode] =
    useState<MatchResultMode>("points");
  const [knockoutMatchFormat, setKnockoutMatchFormat] =
    useState<KnockoutMatchFormat>("bo3_semis_finals");
  const [roundRobinMatchFormat, setRoundRobinMatchFormat] =
    useState<RoundRobinMatchFormat>("bo1");
  const [teamSize, setTeamSize] = useState<2 | 3 | 4>(2);
  const [courtsAvailable, setCourtsAvailable] = useState(1);
  const [inputMode, setInputMode] = useState<"teams" | "players">("teams");
  const [allowSelfJoin, setAllowSelfJoin] = useState(false);
  const [eventParticipantCount, setEventParticipantCount] = useState(8);
  const [eventDisciplineCount, setEventDisciplineCount] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateFormat(nextFormat: TournamentFormat) {
    setFormat(nextFormat);

    if (nextFormat === "individual_mixer") {
      setInputMode("players");
      setAllowSelfJoin(false);
    }

    if (nextFormat === "event") {
      setCourtsAvailable(1);
      setAllowSelfJoin(false);
      setMatchResultMode("winner_only");
      setKnockoutMatchFormat("bo1");
    }

    if (nextFormat !== "team_round_robin") {
      setRoundRobinMatchFormat("bo1");
    }
  }

  function updateMatchResultMode(nextMode: MatchResultMode) {
    setMatchResultMode(nextMode);
    setKnockoutMatchFormat(
      nextMode === "winner_only" ? "bo1" : "bo3_semis_finals",
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name,
          format,
          ...(format === "double_elimination"
            ? {
                knockoutBracketType,
                firstRoundPairingMode,
                matchResultMode,
                knockoutMatchFormat:
                  matchResultMode === "winner_only"
                    ? "bo1"
                    : knockoutMatchFormat,
              }
            : {}),
          ...(format === "event"
            ? {
                matchResultMode: "winner_only",
                knockoutMatchFormat: "bo1",
                eventParticipantCount,
                eventDisciplineCount,
              }
            : {}),
          teamSize,
          courtsAvailable: format === "event" ? 1 : courtsAvailable,
          inputMode,
          allowSelfJoin: format === "event" ? false : allowSelfJoin,
          ...(format === "team_round_robin" ? { roundRobinMatchFormat } : {}),
        }),
      });
      const body = (await response.json()) as ApiError & { _id?: string };

      if (!response.ok || !body._id) {
        setError(body.error ?? t("unableToCreateTournament"));
        return;
      }

      router.push(`/admin/tournament/${body._id}/setup`);
      router.refresh();
    } catch {
      setError(t("unableToCreateTournament"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">{t("newTournament")}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        {t("configureTournamentDescription")}
      </p>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            htmlFor="name"
          >
            {t("tournamentName")}
          </label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
            id="name"
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("tournamentFormat")}
          </legend>
          <div className="mt-2 space-y-2">
            {([
              ["double_elimination", t("doubleElimination")],
              ["team_round_robin", t("teamRoundRobin")],
              ["individual_mixer", t("individualMixer")],
              ["event", t("eventTournament")],
            ] as const).map(([value, label]) => (
              <label className="flex items-center gap-2" key={value}>
                <input
                  checked={format === value}
                  name="format"
                  onChange={() => updateFormat(value)}
                  type="radio"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {format === "double_elimination" ? (
          <>
            <fieldset>
              <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("knockoutBracket")}
              </legend>
              <div className="mt-2 space-y-2">
                {([
                  ["double_elimination", t("doubleElimination")],
                  ["single_elimination", t("singleElimination")],
                ] as const).map(([value, label]) => (
                  <label className="flex items-center gap-2" key={value}>
                    <input
                      checked={knockoutBracketType === value}
                      name="knockoutBracketType"
                      onChange={() => setKnockoutBracketType(value)}
                      type="radio"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("knockoutMatchOptions")}
              </legend>
              <div className="mt-2 space-y-2">
                {([
                  ["random", t("randomFirstRoundPairing")],
                  ["manual", t("manualFirstRoundPairing")],
                ] as const).map(([value, label]) => (
                  <label className="flex items-center gap-2" key={value}>
                    <input
                      checked={firstRoundPairingMode === value}
                      name="firstRoundPairingMode"
                      onChange={() => setFirstRoundPairingMode(value)}
                      type="radio"
                    />
                    {label}
                  </label>
                ))}
                {([
                  ["points", t("pointsScoring")],
                  ["winner_only", t("winnerOnly")],
                ] as const).map(([value, label]) => (
                  <label className="flex items-center gap-2" key={value}>
                    <input
                      checked={matchResultMode === value}
                      name="matchResultMode"
                      onChange={() => updateMatchResultMode(value)}
                      type="radio"
                    />
                    {label}
                  </label>
                ))}
                {matchResultMode === "points" ? (
                  <label className="flex items-center gap-2">
                    <input
                      checked={knockoutMatchFormat === "bo3_semis_finals"}
                      onChange={(event) =>
                        setKnockoutMatchFormat(
                          event.target.checked ? "bo3_semis_finals" : "bo1",
                        )
                      }
                      type="checkbox"
                    />
                    {t("bestOfThreeSemisFinal")}
                  </label>
                ) : null}
              </div>
            </fieldset>
          </>
        ) : null}

        {format === "event" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="eventParticipantCount"
              >
                {t("participants")}
              </label>
              <input
                className="mt-1 w-28 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
                id="eventParticipantCount"
                max={32}
                min={2}
                onChange={(event) =>
                  setEventParticipantCount(
                    Number.parseInt(event.target.value, 10),
                  )
                }
                required
                type="number"
                value={eventParticipantCount}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="eventDisciplineCount"
              >
                {t("disciplines")}
              </label>
              <input
                className="mt-1 w-28 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
                id="eventDisciplineCount"
                max={10}
                min={1}
                onChange={(event) =>
                  setEventDisciplineCount(
                    Number.parseInt(event.target.value, 10),
                  )
                }
                required
                type="number"
                value={eventDisciplineCount}
              />
            </div>
          </div>
        ) : (
          <fieldset>
            <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("teamSize")}
            </legend>
            <div className="mt-2 flex gap-4">
              {([2, 3, 4] as const).map((size) => (
                <label className="flex items-center gap-2" key={size}>
                  <input
                    checked={teamSize === size}
                    name="teamSize"
                    onChange={() => setTeamSize(size)}
                    type="radio"
                  />
                  {size} {t("players")}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {format === "event" ? null : (
          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="courtsAvailable"
            >
              {t("courtsAvailable")}
            </label>
            <input
              className="mt-1 w-28 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
              id="courtsAvailable"
              max={10}
              min={1}
              onChange={(event) =>
                setCourtsAvailable(Number.parseInt(event.target.value, 10))
              }
              required
              type="number"
              value={courtsAvailable}
            />
          </div>
        )}

        <fieldset>
          <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("teamEntry")}
          </legend>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2">
              <input
                checked={inputMode === "teams"}
                disabled={format === "individual_mixer"}
                name="inputMode"
                onChange={() => {
                  setInputMode("teams");
                  if (format === "individual_mixer") {
                    setFormat("double_elimination");
                  }
                  setAllowSelfJoin(false);
                }}
                type="radio"
              />
              {t("enterTeamNames")}
            </label>
            <label className="flex items-center gap-2">
              <input
                checked={inputMode === "players"}
                name="inputMode"
                onChange={() => {
                  setInputMode("players");
                }}
                type="radio"
              />
              {t("enterPlayerNames")}
            </label>
          </div>
        </fieldset>

        <label className="flex items-center gap-2">
          <input
                checked={allowSelfJoin}
            disabled={inputMode !== "players" || format === "event"}
            onChange={(event) => setAllowSelfJoin(event.target.checked)}
            type="checkbox"
          />
          {t("allowPlayerSelfJoin")}
        </label>

        {format === "team_round_robin" ? (
          <fieldset>
            <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("roundRobinMatchFormat")}
            </legend>
            <div className="mt-2 space-y-2">
              {([
                ["bo1", t("oneSetPerMatch")],
                ["bo3", t("bestOfThree")],
              ] as const).map(([value, label]) => (
                <label className="flex items-center gap-2" key={value}>
                  <input
                    checked={roundRobinMatchFormat === value}
                    name="roundRobinMatchFormat"
                    onChange={() => setRoundRobinMatchFormat(value)}
                    type="radio"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {error ? (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? t("creating") : t("createTournament")}
        </button>
      </form>
    </section>
  );
}

