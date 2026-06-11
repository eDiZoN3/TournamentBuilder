"use client";

import { type FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cardSurface } from "@/components/ui/Card";
import { Field, FormError, Input } from "@/components/ui/Field";
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
      className={`mx-auto max-w-md p-8 ${cardSurface}`}
      data-testid="signup-auth-card"
    >
      <h1 className="text-2xl font-bold tracking-tight">{t("playerSignUp")}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {t("createAccountDescription")}
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Field htmlFor="firstName" label={t("firstName")}>
          <Input
            id="firstName"
            maxLength={50}
            onChange={(event) => setFirstName(event.target.value)}
            required
            value={firstName}
          />
        </Field>
        <Field htmlFor="surname" label={t("surname")}>
          <Input
            id="surname"
            maxLength={50}
            onChange={(event) => setSurname(event.target.value)}
            value={surname}
          />
        </Field>
        <Field htmlFor="email" label={t("email")}>
          <Input
            autoComplete="email"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </Field>
        <Field htmlFor="password" label={t("password")}>
          <Input
            autoComplete="new-password"
            id="password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </Field>
        {error ? <FormError>{error}</FormError> : null}
        <Button disabled={isSubmitting} fullWidth size="lg" type="submit">
          {isSubmitting ? t("creating") : t("createAccount")}
        </Button>
      </form>
    </section>
  );
}
