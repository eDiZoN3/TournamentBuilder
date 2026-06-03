"use client";

import Link from "next/link";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { useLocale } from "@/components/ui/LocaleProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface NavbarProps {
  isAuthenticated: boolean;
  role?: "admin" | "player" | null;
}

export function Navbar({ isAuthenticated, role = null }: NavbarProps) {
  const { t } = useLocale();
  const accountHref = role === "player" ? "/account" : "/admin/dashboard";
  const accountLabel = role === "player" ? t("account") : t("dashboard");

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link className="font-semibold text-slate-900 dark:text-white" href="/">
          Raro Volleyball
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm font-medium">
          <Link
            className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            href="/"
          >
            {t("tournaments")}
          </Link>
          <Link
            className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            href="/stats"
          >
            {t("stats")}
          </Link>
          {!isAuthenticated ? (
            <Link
              className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              href="/signup"
            >
              {t("signUp")}
            </Link>
          ) : null}
          <Link
            className="rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            href={isAuthenticated ? accountHref : "/admin/login"}
          >
            {isAuthenticated ? accountLabel : t("adminLogin")}
          </Link>
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

