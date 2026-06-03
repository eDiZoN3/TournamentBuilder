"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface ApiError {
  error?: string;
}

export default function NewTournamentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [teamSize, setTeamSize] = useState<2 | 3 | 4>(2);
  const [courtsAvailable, setCourtsAvailable] = useState(1);
  const [inputMode, setInputMode] = useState<"teams" | "players">("teams");
  const [allowSelfJoin, setAllowSelfJoin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          teamSize,
          courtsAvailable,
          inputMode,
          allowSelfJoin,
        }),
      });
      const body = (await response.json()) as ApiError & { _id?: string };

      if (!response.ok || !body._id) {
        setError(body.error ?? "Unable to create tournament.");
        return;
      }

      router.push(`/admin/tournament/${body._id}/setup`);
      router.refresh();
    } catch {
      setError("Unable to create tournament.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">New tournament</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Configure the tournament before entering teams or players.
      </p>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            htmlFor="name"
          >
            Tournament name
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
            Team size
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
                {size} players
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            htmlFor="courtsAvailable"
          >
            Courts available
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

        <fieldset>
          <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Team entry
          </legend>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2">
              <input
                checked={inputMode === "teams"}
                name="inputMode"
                onChange={() => {
                  setInputMode("teams");
                  setAllowSelfJoin(false);
                }}
                type="radio"
              />
              Enter team names
            </label>
            <label className="flex items-center gap-2">
              <input
                checked={inputMode === "players"}
                name="inputMode"
                onChange={() => setInputMode("players")}
                type="radio"
              />
              Enter player names
            </label>
          </div>
        </fieldset>

        <label className="flex items-center gap-2">
          <input
            checked={allowSelfJoin}
            disabled={inputMode !== "players"}
            onChange={(event) => setAllowSelfJoin(event.target.checked)}
            type="checkbox"
          />
          Allow player account self-join
        </label>

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
          {isSubmitting ? "Creating..." : "Create tournament"}
        </button>
      </form>
    </section>
  );
}

