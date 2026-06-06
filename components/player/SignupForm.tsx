"use client";

import { type FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/ui/LocaleProvider";

interface ApiError {
  error?: string;
}

export function SignupForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          surname,
          email,
          password,
        }),
      });
      const body = (await response.json()) as ApiError;

      if (!response.ok) {
        setError(body.error ?? t("unableToCreatePlayerAccount"));
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!signInResult?.ok) {
        setError(t("createdAccountSignInFailed"));
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError(t("unableToCreatePlayerAccount"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      data-testid="signup-auth-card"
    >
      <h1 className="text-2xl font-bold tracking-tight">{t("playerSignUp")}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {t("createAccountDescription")}
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="firstName">
            {t("firstName")}
          </label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
            id="firstName"
            maxLength={50}
            onChange={(event) => setFirstName(event.target.value)}
            required
            value={firstName}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="surname">
            {t("surname")}
          </label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
            id="surname"
            maxLength={50}
            onChange={(event) => setSurname(event.target.value)}
            value={surname}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
            {t("email")}
          </label>
          <input
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
            {t("password")}
          </label>
          <input
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600"
            id="password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>
        {error ? (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? t("creating") : t("createAccount")}
        </button>
      </form>
    </section>
  );
}
