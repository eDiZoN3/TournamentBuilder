"use client";

import { type FormEvent, useState } from "react";

export interface AdminUserSummary {
  _id: string;
  createdAt: string;
  email: string;
  mustChangePassword: boolean;
}

interface CreateAdminResponse {
  admin: AdminUserSummary;
  temporaryPassword: string;
}

interface AdminUsersPanelProps {
  initialAdmins: AdminUserSummary[];
}

export function AdminUsersPanel({ initialAdmins }: AdminUsersPanelProps) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<CreateAdminResponse | null>(
    null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreatedAdmin(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });
      const body = (await response.json()) as
        | CreateAdminResponse
        | { error?: string };

      if (!response.ok) {
        setError(
          "error" in body && body.error
            ? body.error
            : "Unable to create admin account.",
        );
        return;
      }

      const result = body as CreateAdminResponse;

      setAdmins((current) => [result.admin, ...current]);
      setCreatedAdmin(result);
      setEmail("");
    } catch {
      setError("Unable to create admin account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="admin-accounts-title"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            className="text-lg font-semibold text-slate-900 dark:text-white"
            id="admin-accounts-title"
          >
            Admin accounts
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create admins with a one-time temporary password.
          </p>
        </div>
      </div>

      <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
        <div className="min-w-0 flex-1">
          <label
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            htmlFor="new-admin-email"
          >
            New admin email
          </label>
          <input
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:focus:ring-slate-700"
            id="new-admin-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>
        <div className="flex items-end">
          <button
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating..." : "Create admin"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="mt-3 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {createdAdmin ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Temporary password</p>
              <p className="mt-1 font-mono text-lg">
                {createdAdmin.temporaryPassword}
              </p>
              <p className="mt-1 text-sm">
                Share it once. This admin must change it on first login.
              </p>
            </div>
            <button
              aria-label="Dismiss temporary password"
              className="rounded-md border border-amber-300 px-3 py-2 text-sm font-semibold dark:border-amber-600"
              onClick={() => setCreatedAdmin(null)}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 overflow-x-auto">
        {admins.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No admin accounts yet.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2 pr-4 font-semibold">Email</th>
                <th className="py-2 pr-4 font-semibold">Status</th>
                <th className="py-2 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                    {admin.email}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                    {admin.mustChangePassword
                      ? "Password change required"
                      : "Active"}
                  </td>
                  <td className="py-3 text-slate-500 dark:text-slate-400">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
