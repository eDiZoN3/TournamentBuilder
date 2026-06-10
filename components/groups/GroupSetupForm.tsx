"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/ui/LocaleProvider";

interface TeamRow {
  id: number;
  name: string;
}

interface CategoryRow {
  id: number;
  name: string;
}

let _nextId = 1;
function nextId() {
  return _nextId++;
}

export function GroupSetupForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [groupName, setGroupName] = useState("");
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addTeam() {
    setTeams((prev) => [...prev, { id: nextId(), name: "" }]);
  }

  function removeTeam(id: number) {
    setTeams((prev) => prev.filter((team) => team.id !== id));
  }

  function updateTeam(id: number, name: string) {
    setTeams((prev) => prev.map((team) => (team.id === id ? { ...team, name } : team)));
  }

  function addCategory() {
    setCategories((prev) => [...prev, { id: nextId(), name: "" }]);
  }

  function removeCategory(id: number) {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  }

  function updateCategory(id: number, name: string) {
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, name } : cat)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validTeams = teams.filter((team) => team.name.trim().length > 0);
    const validCategories = categories.filter((cat) => cat.name.trim().length > 0);

    if (validTeams.length < 2) {
      setError(t("atLeastTwoTeamsRequired"));
      return;
    }

    if (validCategories.length < 1) {
      setError(t("atLeastOneCategoryRequired"));
      return;
    }

    setSubmitting(true);

    try {
      const createRes = await fetch("/api/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: groupName.trim() }),
      });

      if (!createRes.ok) {
        setError(t("failedToCreateGroup"));
        return;
      }

      const { _id: groupId } = (await createRes.json()) as { _id: string };

      const teamsRes = await fetch(`/api/groups/${groupId}/teams`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          teams: validTeams.map((team) => ({ name: team.name.trim(), players: [] })),
        }),
      });

      if (!teamsRes.ok) {
        setError(t("failedToSaveTeams"));
        return;
      }

      for (const cat of validCategories) {
        const catRes = await fetch(`/api/groups/${groupId}/categories`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: cat.name.trim() }),
        });

        if (!catRes.ok) {
          setError(t("failedToSaveCategories"));
          return;
        }
      }

      router.push(`/admin/groups/${groupId}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="group-name" className="block font-medium mb-1">
          {t("groupName")}
        </label>
        <input
          id="group-name"
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <h2 className="font-semibold mb-2">{t("teams")}</h2>
        <div className="space-y-2">
          {teams.map((team) => (
            <div key={team.id} className="flex gap-2">
              <input
                type="text"
                placeholder={t("teamNameField").replace(" {n}", "")}
                value={team.name}
                onChange={(e) => updateTeam(team.id, e.target.value)}
                className="flex-1 border rounded px-3 py-1"
              />
              <button
                type="button"
                onClick={() => removeTeam(team.id)}
                aria-label={t("remove") + " team"}
                className="text-red-500 px-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTeam}
          className="mt-2 text-blue-600 hover:underline text-sm"
        >
          {t("addTeam")}
        </button>
      </div>

      <div>
        <h2 className="font-semibold mb-2">{t("categories")}</h2>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex gap-2">
              <input
                type="text"
                placeholder={t("categoryName")}
                value={cat.name}
                onChange={(e) => updateCategory(cat.id, e.target.value)}
                className="flex-1 border rounded px-3 py-1"
              />
              <button
                type="button"
                onClick={() => removeCategory(cat.id)}
                aria-label={t("remove") + " category"}
                className="text-red-500 px-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addCategory}
          className="mt-2 text-blue-600 hover:underline text-sm"
        >
          {t("addCategory")}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {t("createGroup")}
      </button>
    </form>
  );
}
