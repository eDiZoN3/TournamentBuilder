"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { useLocale } from "@/components/ui/LocaleProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface NavbarProps {
  isAuthenticated: boolean;
  role?: "admin" | "tournament_lead" | "player" | null;
}

export function Navbar({ isAuthenticated, role = null }: NavbarProps) {
  const { t } = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const accountHref = role === "player" ? "/account" : "/admin/dashboard";
  const accountLabel = role === "player" ? t("account") : t("dashboard");
  const loginLabel = t("signIn");

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    function handleMouseDown(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !navRef.current?.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isMenuOpen]);

  const publicLinks = (
    <>
      <Link
        className="inline-flex rounded text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-slate-950 md:inline-flex"
        href="/"
        onClick={() => setIsMenuOpen(false)}
      >
        {t("tournaments")}
      </Link>
      <Link
        className="inline-flex rounded text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-slate-950 md:inline-flex"
        href="/stats"
        onClick={() => setIsMenuOpen(false)}
      >
        {t("stats")}
      </Link>
    </>
  );

  const sessionLinks = (
    <>
      {!isAuthenticated ? (
        <Link
          className="inline-flex rounded text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-slate-950"
          href="/signup"
          onClick={() => setIsMenuOpen(false)}
        >
          {t("signUp")}
        </Link>
      ) : null}
      <Link
        className="inline-flex rounded-md bg-slate-900 px-3 py-2 text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-slate-950"
        href={isAuthenticated ? accountHref : "/login"}
        onClick={() => setIsMenuOpen(false)}
      >
        {isAuthenticated ? accountLabel : loginLabel}
      </Link>
      {isAuthenticated && role === "player" ? (
        <Link
          className="inline-flex rounded text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-slate-950"
          href="/account#practice-matches"
          onClick={() => setIsMenuOpen(false)}
        >
          {t("practiceMatches")}
        </Link>
      ) : null}
      {isAuthenticated ? (
        <Button
          onClick={() => signOut({ callbackUrl: "/login" })}
          variant="outline"
        >
          {t("logOut")}
        </Button>
      ) : null}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <nav
        aria-label={t("primaryNavigation")}
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4"
        ref={navRef}
      >
        <Link className="font-semibold text-slate-900 dark:text-white" href="/">
          {t("raroVolleyball")}
        </Link>
        <button
          aria-expanded={isMenuOpen}
          aria-label={
            isMenuOpen ? t("closeNavigationMenu") : t("openNavigationMenu")
          }
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 md:hidden dark:border-slate-600 dark:text-slate-200"
          onClick={() => setIsMenuOpen((current) => !current)}
          type="button"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            {isMenuOpen ? "x" : "="}
          </span>
        </button>
        <div className="hidden items-center justify-end gap-3 text-sm font-medium md:flex">
          {publicLinks}
          {sessionLinks}
          <LocaleToggle />
          <ThemeToggle />
        </div>
        {isMenuOpen ? (
          <nav
            aria-label={t("mobileNavigation")}
            className="flex w-full flex-col gap-3 border-t border-slate-200 pt-4 text-sm font-medium md:hidden dark:border-slate-800"
          >
            {publicLinks}
            {sessionLinks}
            <div className="flex items-center gap-3">
              <LocaleToggle />
              <ThemeToggle />
            </div>
          </nav>
        ) : null}
      </nav>
    </header>
  );
}

