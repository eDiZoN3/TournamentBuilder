"use client";

import { type FormEvent, useState } from "react";
import { useLocale } from "@/components/ui/LocaleProvider";

export interface AdminUserSummary {
  _id: string;
  createdAt: string;
  displayRole?: string;
  email: string;
  mustChangePassword: boolean;
  role: "admin" | "tournament_lead";
}

interface CreateAdminResponse {
  admin: AdminUserSummary;
  temporaryPassword: string;
}

interface AdminUsersPanelProps {
  canManageTournamentLeads?: boolean;
  initialAdmins: AdminUserSummary[];
}

export function AdminUsersPanel({
  canManageTournamentLeads = true,
  initialAdmins,
}: AdminUsersPanelProps) {
  const { t } = useLocale();
  const [admins, setAdmins] = useState(initialAdmins);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [createdAdmin, setCreatedAdmin] = useState<CreateAdminResponse | null>(
    null,
  );

  function roleLabel(admin: AdminUserSummary) {
    return admin.role === "admin" ? t("admin") : t("tournamentLead");
  }

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
            : t("unableToCreateAdminAccount"),
        );
        return;
      }

      const result = body as CreateAdminResponse;

      setAdmins((current) => [result.admin, ...current]);
      setCreatedAdmin(result);
      setEmail("");
    } catch {
      setError(t("unableToCreateAdminAccount"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(admin: AdminUserSummary) {
    setError(null);
    setRemovingId(admin._id);

    try {
      const response = await fetch(`/api/admin/users/${admin._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let message = t("unableToRemoveTournamentLead");

        try {
          const body = (await response.json()) as { error?: string };

          message = body.error ?? message;
        } catch {
          // Preserve the generic message if the response body is empty.
        }

        setError(message);
        return;
      }

      setAdmins((current) =>
        current.filter((candidate) => candidate._id !== admin._id),
      );
    } catch {
      setError(t("unableToRemoveTournamentLead"));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section
      aria-labelledby="admin-accounts-title"
      className="w-full max-w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            className="text-lg font-semibold text-slate-900 dark:text-white"
            id="admin-accounts-title"
          >
            {t("tournamentLeadAccounts")}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("manageTournamentLeadsNote")}
          </p>
        </div>
      </div>

      {canManageTournamentLeads ? (
        <form
          className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row"
          onSubmit={handleSubmit}
        >
          <div className="min-w-0 flex-1">
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="new-admin-email"
            >
              {t("newTournamentLeadEmail")}
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
              {isSubmitting ? t("saving") : t("createTournamentLead")}
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {createdAdmin ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{t("tempPassword")}</p>
              <p className="mt-1 font-mono text-lg">
                {createdAdmin.temporaryPassword}
              </p>
              <p className="mt-1 text-sm">
                {t("temporaryPasswordHelp")}
              </p>
            </div>
            <button
              aria-label={t("dismissTemporaryPassword")}
              className="rounded-md border border-amber-300 px-3 py-2 text-sm font-semibold dark:border-amber-600"
              onClick={() => setCreatedAdmin(null)}
              type="button"
            >
              {t("dismiss")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 w-full max-w-full overflow-x-auto">
        {admins.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("noTournamentLeadAccounts")}
          </p>
        ) : (
          <table className="w-full min-w-max text-left text-sm">
            <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2 pr-4 font-semibold">{t("email")}</th>
                <th className="py-2 pr-4 font-semibold">{t("tournamentLeadRole")}</th>
                <th className="py-2 pr-4 font-semibold">{t("status")}</th>
                <th className="py-2 pr-4 font-semibold">{t("tournamentLeadCreated")}</th>
                {canManageTournamentLeads ? (
                  <th className="py-2 font-semibold">{t("tournamentLeadActions")}</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td className="max-w-72 break-all py-3 pr-4 font-medium text-slate-900 dark:text-white">
                    {admin.email}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                    {roleLabel(admin)}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                    {admin.mustChangePassword
                      ? t("passwordChangeRequired")
                      : t("active")}
                  </td>
                  <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  {canManageTournamentLeads ? (
                    <td className="py-3">
                      {admin.role === "tournament_lead" ? (
                        <button
                          aria-label={`${t("remove")} ${admin.email}`}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                          disabled={removingId === admin._id}
                          onClick={() => void handleRemove(admin)}
                          type="button"
                        >
                          {removingId === admin._id ? t("saving") : t("remove")}
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
