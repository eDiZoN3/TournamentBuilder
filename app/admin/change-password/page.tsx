"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { cardSurface } from "@/components/ui/Card";
import { Field, FormError, Input } from "@/components/ui/Field";
import { useLocale } from "@/components/ui/LocaleProvider";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { t } = useLocale();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
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
      const body = (await response.json()) as {
        error?: string;
        role?: "admin" | "player";
      };

      if (!response.ok) {
        setError(body.error ?? t("unableToChangePassword"));
        return;
      }

      await updateSession({ mustChangePassword: false });
      router.push(body.role === "player" ? "/account" : "/admin/dashboard");
    } catch {
      setError(t("unableToChangePassword"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className={`w-full max-w-md p-8 ${cardSurface}`}>
        <h1 className="text-2xl font-bold tracking-tight">{t("changePassword")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("setOwnPassword")}
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Field htmlFor="current-password" label={t("currentPassword")}>
            <Input
              autoComplete="current-password"
              id="current-password"
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              type="password"
              value={currentPassword}
            />
          </Field>
          <Field htmlFor="new-password" label={t("newPassword")}>
            <Input
              autoComplete="new-password"
              id="new-password"
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
          </Field>
          <Field htmlFor="confirm-password" label={t("confirmNewPassword")}>
            <Input
              autoComplete="new-password"
              id="confirm-password"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </Field>
          {error ? <FormError>{error}</FormError> : null}
          <Button disabled={isSubmitting} fullWidth size="lg" type="submit">
            {isSubmitting ? t("changing") : t("changePassword")}
          </Button>
        </form>
      </section>
    </main>
  );
}
