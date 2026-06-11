"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, FormError, Input } from "@/components/ui/Field";
import { useLocale } from "@/components/ui/LocaleProvider";
import { OptionCard } from "@/components/ui/OptionCard";
import { cn } from "@/lib/cn";
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

function SectionHeading({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
        {step}
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Legend({ children }: { children: ReactNode }) {
  return (
    <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
      {children}
    </legend>
  );
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

  const formatOptions = [
    {
      value: "double_elimination",
      label: t("doubleElimination"),
      description: t("doubleEliminationDescription"),
      icon: "🏆",
    },
    {
      value: "team_round_robin",
      label: t("teamRoundRobin"),
      description: t("teamRoundRobinDescription"),
      icon: "🔁",
    },
    {
      value: "individual_mixer",
      label: t("individualMixer"),
      description: t("individualMixerDescription"),
      icon: "🎲",
    },
    {
      value: "event",
      label: t("eventTournament"),
      description: t("eventTournamentDescription"),
      icon: "🎪",
    },
  ] as const;

  const hasFormatOptions =
    format === "double_elimination" ||
    format === "team_round_robin" ||
    format === "event";
  const entryStep = hasFormatOptions ? 4 : 3;

  return (
    <section className="mx-auto max-w-3xl">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("tournamentManagement")}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {t("newTournament")}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {t("configureTournamentDescription")}
        </p>
      </header>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <Card className="space-y-4">
          <SectionHeading step={1} title={t("basics")} />
          <Field htmlFor="name" label={t("tournamentName")}>
            <Input
              id="name"
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionHeading step={2} title={t("tournamentFormat")} />
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
            {formatOptions.map((option) => (
              <OptionCard
                checked={format === option.value}
                description={option.description}
                icon={option.icon}
                key={option.value}
                name="format"
                onChange={() => updateFormat(option.value)}
                title={option.label}
              />
            ))}
          </div>
        </Card>

        {format === "double_elimination" ? (
          <Card className="space-y-6">
            <SectionHeading step={3} title={t("knockoutMatchOptions")} />

            <fieldset>
              <Legend>{t("knockoutBracket")}</Legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <OptionCard
                  checked={knockoutBracketType === "double_elimination"}
                  description={t("doubleEliminationDescription")}
                  name="knockoutBracketType"
                  onChange={() => setKnockoutBracketType("double_elimination")}
                  title={t("doubleElimination")}
                />
                <OptionCard
                  checked={knockoutBracketType === "single_elimination"}
                  description={t("singleEliminationDescription")}
                  name="knockoutBracketType"
                  onChange={() => setKnockoutBracketType("single_elimination")}
                  title={t("singleElimination")}
                />
              </div>
            </fieldset>

            <fieldset>
              <Legend>{t("firstRoundPairing")}</Legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <OptionCard
                  checked={firstRoundPairingMode === "random"}
                  description={t("randomFirstRoundPairingDescription")}
                  name="firstRoundPairingMode"
                  onChange={() => setFirstRoundPairingMode("random")}
                  title={t("randomFirstRoundPairing")}
                />
                <OptionCard
                  checked={firstRoundPairingMode === "manual"}
                  description={t("manualFirstRoundPairingDescription")}
                  name="firstRoundPairingMode"
                  onChange={() => setFirstRoundPairingMode("manual")}
                  title={t("manualFirstRoundPairing")}
                />
              </div>
            </fieldset>

            <fieldset>
              <Legend>{t("scoring")}</Legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <OptionCard
                  checked={matchResultMode === "points"}
                  description={t("pointsScoringDescription")}
                  name="matchResultMode"
                  onChange={() => updateMatchResultMode("points")}
                  title={t("pointsScoring")}
                />
                <OptionCard
                  checked={matchResultMode === "winner_only"}
                  description={t("winnerOnlyDescription")}
                  name="matchResultMode"
                  onChange={() => updateMatchResultMode("winner_only")}
                  title={t("winnerOnly")}
                />
              </div>
              {matchResultMode === "points" ? (
                <div className="mt-3">
                  <OptionCard
                    checked={knockoutMatchFormat === "bo3_semis_finals"}
                    description={t("bestOfThreeSemisFinalDescription")}
                    onChange={() =>
                      setKnockoutMatchFormat(
                        knockoutMatchFormat === "bo3_semis_finals"
                          ? "bo1"
                          : "bo3_semis_finals",
                      )
                    }
                    title={t("bestOfThreeSemisFinal")}
                    type="checkbox"
                  />
                </div>
              ) : null}
            </fieldset>
          </Card>
        ) : null}

        {format === "team_round_robin" ? (
          <Card className="space-y-4">
            <SectionHeading step={3} title={t("roundRobinMatchFormat")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                checked={roundRobinMatchFormat === "bo1"}
                name="roundRobinMatchFormat"
                onChange={() => setRoundRobinMatchFormat("bo1")}
                title={t("oneSetPerMatch")}
              />
              <OptionCard
                checked={roundRobinMatchFormat === "bo3"}
                name="roundRobinMatchFormat"
                onChange={() => setRoundRobinMatchFormat("bo3")}
                title={t("bestOfThree")}
              />
            </div>
          </Card>
        ) : null}

        {format === "event" ? (
          <Card className="space-y-4">
            <SectionHeading
              description={t("eventScoringNote")}
              step={3}
              title={t("eventTournament")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                hint={t("participantsHint")}
                htmlFor="eventParticipantCount"
                label={t("participants")}
              >
                <Input
                  className="max-w-[10rem]"
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
              </Field>
              <Field
                hint={t("disciplinesHint")}
                htmlFor="eventDisciplineCount"
                label={t("disciplines")}
              >
                <Input
                  className="max-w-[10rem]"
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
              </Field>
            </div>
          </Card>
        ) : null}

        <Card className="space-y-6">
          <SectionHeading step={entryStep} title={t("participantsAndEntry")} />

          {format === "event" ? null : (
            <fieldset>
              <Legend>{t("teamSize")}</Legend>
              <div className="inline-flex flex-wrap gap-2">
                {([2, 3, 4] as const).map((size) => (
                  <label
                    className={cn(
                      "cursor-pointer rounded-md border px-4 py-2 text-sm font-medium transition",
                      teamSize === size
                        ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800",
                    )}
                    key={size}
                  >
                    <input
                      checked={teamSize === size}
                      className="sr-only"
                      name="teamSize"
                      onChange={() => setTeamSize(size)}
                      type="radio"
                    />
                    {size} {t("players")}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t("teamSizeHint")}
              </p>
            </fieldset>
          )}

          {format === "event" ? null : (
            <Field
              hint={t("courtsAvailableHint")}
              htmlFor="courtsAvailable"
              label={t("courtsAvailable")}
            >
              <Input
                className="max-w-[10rem]"
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
            </Field>
          )}

          <fieldset>
            <Legend>{t("teamEntry")}</Legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                checked={inputMode === "teams"}
                description={t("enterTeamNamesDescription")}
                disabled={format === "individual_mixer"}
                name="inputMode"
                onChange={() => {
                  setInputMode("teams");
                  if (format === "individual_mixer") {
                    setFormat("double_elimination");
                  }
                  setAllowSelfJoin(false);
                }}
                title={t("enterTeamNames")}
              />
              <OptionCard
                checked={inputMode === "players"}
                description={t("enterPlayerNamesDescription")}
                name="inputMode"
                onChange={() => setInputMode("players")}
                title={t("enterPlayerNames")}
              />
            </div>
          </fieldset>

          <OptionCard
            checked={allowSelfJoin}
            description={t("allowPlayerSelfJoinHint")}
            disabled={inputMode !== "players" || format === "event"}
            onChange={() => setAllowSelfJoin(!allowSelfJoin)}
            title={t("allowPlayerSelfJoin")}
            type="checkbox"
          />
        </Card>

        {error ? <FormError>{error}</FormError> : null}

        <div className="flex justify-end">
          <Button disabled={isSubmitting} size="lg" type="submit">
            {isSubmitting ? t("creating") : t("createTournament")}
          </Button>
        </div>
      </form>
    </section>
  );
}
