"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [groupName, setGroupName] = useState("");
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addTeam() {
    setTeams((prev) => [...prev, { id: nextId(), name: "" }]);
  }

  function removeTeam(id: number) {
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTeam(id: number, name: string) {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  }

  function addCategory() {
    setCategories((prev) => [...prev, { id: nextId(), name: "" }]);
  }

  function removeCategory(id: number) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function updateCategory(id: number, name: string) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validTeams = teams.filter((t) => t.name.trim().length > 0);
    const validCategories = categories.filter((c) => c.name.trim().length > 0);

    if (validTeams.length < 2) {
      setError("At least 2 teams are required.");
      return;
    }

    if (validCategories.length < 1) {
      setError("At least 1 category is required.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create the group
      const createRes = await fetch("/api/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: groupName.trim() }),
      });

      if (!createRes.ok) {
        setError("Failed to create group.");
        return;
      }

      const { _id: groupId } = (await createRes.json()) as { _id: string };

      // 2. Set teams
      const teamsRes = await fetch(`/api/groups/${groupId}/teams`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          teams: validTeams.map((t) => ({ name: t.name.trim(), players: [] })),
        }),
      });

      if (!teamsRes.ok) {
        setError("Failed to save teams.");
        return;
      }

      // 3. Create categories
      for (const cat of validCategories) {
        const catRes = await fetch(`/api/groups/${groupId}/categories`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: cat.name.trim() }),
        });

        if (!catRes.ok) {
          setError("Failed to save categories.");
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
          Group name
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
        <h2 className="font-semibold mb-2">Teams</h2>
        <div className="space-y-2">
          {teams.map((t) => (
            <div key={t.id} className="flex gap-2">
              <input
                type="text"
                placeholder="Team name"
                value={t.name}
                onChange={(e) => updateTeam(t.id, e.target.value)}
                className="flex-1 border rounded px-3 py-1"
              />
              <button
                type="button"
                onClick={() => removeTeam(t.id)}
                aria-label="Remove team"
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
          Add team
        </button>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Categories</h2>
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex gap-2">
              <input
                type="text"
                placeholder="Category name"
                value={c.name}
                onChange={(e) => updateCategory(c.id, e.target.value)}
                className="flex-1 border rounded px-3 py-1"
              />
              <button
                type="button"
                onClick={() => removeCategory(c.id)}
                aria-label="Remove category"
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
          Add category
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Create group
      </button>
    </form>
  );
}
