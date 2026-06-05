"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
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
  const loginLabel = "Log in";

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
        className="inline-flex text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white md:inline-flex"
        href="/"
        onClick={() => setIsMenuOpen(false)}
      >
        {t("tournaments")}
      </Link>
      <Link
        className="inline-flex text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white md:inline-flex"
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
          className="inline-flex text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          href="/signup"
          onClick={() => setIsMenuOpen(false)}
        >
          {t("signUp")}
        </Link>
      ) : null}
      <Link
        className="inline-flex rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        href={isAuthenticated ? accountHref : "/login"}
        onClick={() => setIsMenuOpen(false)}
      >
        {isAuthenticated ? accountLabel : loginLabel}
      </Link>
      {isAuthenticated ? (
        <button
          className="inline-flex rounded-md border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => signOut({ callbackUrl: "/login" })}
          type="button"
        >
          {t("logOut")}
        </button>
      ) : null}
    </>
  );

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4"
        ref={navRef}
      >
        <Link className="font-semibold text-slate-900 dark:text-white" href="/">
          Raro Volleyball
        </Link>
        <button
          aria-expanded={isMenuOpen}
          aria-label={
            isMenuOpen ? "Close navigation menu" : "Open navigation menu"
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
            aria-label="Mobile navigation"
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

