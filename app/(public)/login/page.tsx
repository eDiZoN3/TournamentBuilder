"use client";

import { type FormEvent, Suspense, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cardSurface } from "@/components/ui/Card";
import { Field, FormError, Input } from "@/components/ui/Field";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { useLocale } from "@/components/ui/LocaleProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type LoginRole = "admin" | "tournament_lead" | "player";

function isAdminCapable(role: LoginRole | undefined): boolean {
  return role === "admin" || role === "tournament_lead";
}

function destinationForRole(
  role: LoginRole | undefined,
  callbackUrl: string | null,
): string {
  const safeCallback = callbackUrl?.startsWith("/") ? callbackUrl : null;

  if (role === "player") {
    return safeCallback === "/account" ? safeCallback : "/account";
  }

  if (isAdminCapable(role)) {
    return safeCallback?.startsWith("/admin")
      ? safeCallback
      : "/admin/dashboard";
  }

  return "/";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        setError(t("invalidCredentials"));
        return;
      }

      const session = await getSession();
      const role = session?.user.role as LoginRole | undefined;

      router.push(destinationForRole(role, searchParams.get("callbackUrl")));
      router.refresh();
    } catch {
      setError(t("unableToSignIn"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md" data-testid="login-page">
      <div className="mb-4 flex justify-end gap-2">
        <LocaleToggle />
        <ThemeToggle />
      </div>
      <section className={`${cardSurface} p-8`} data-testid="login-auth-card">
        <h1 className="text-2xl font-bold tracking-tight">{t("signIn")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("signInDescription")}
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </Field>
          {error ? <FormError>{error}</FormError> : null}
          <Button disabled={isSubmitting} fullWidth size="lg" type="submit">
            {isSubmitting ? t("signingIn") : t("signIn")}
          </Button>
        </form>
      </section>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
