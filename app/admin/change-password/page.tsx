"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(body.error ?? "Unable to change password.");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Unable to change password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Change password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Set your own password before using the admin area.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="current-password"
            >
              Current password
            </label>
            <input
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              id="current-password"
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              type="password"
              value={currentPassword}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="new-password"
            >
              New password
            </label>
            <input
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              id="new-password"
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="confirm-password"
            >
              Confirm new password
            </label>
            <input
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              id="confirm-password"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </div>
          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Changing..." : "Change password"}
          </button>
        </form>
      </section>
    </main>
  );
}
