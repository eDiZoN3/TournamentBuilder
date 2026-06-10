"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { useLocale } from "@/components/ui/LocaleProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AdminSidebar() {
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function handleMouseDown(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !sidebarRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isOpen]);

  return (
    <aside
      className="flex w-full flex-col gap-4 border-b border-slate-800 bg-slate-900 px-4 py-5 text-white md:min-h-screen md:w-64 md:border-b-0"
      ref={sidebarRef}
    >
      <div className="flex items-center justify-between gap-3">
        <Link className="text-lg font-semibold" href="/admin/dashboard">
          {t("tournamentAdmin")}
        </Link>
        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? t("closeAdminNavigation") : t("openAdminNavigation")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-600 text-slate-200 md:hidden"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            {isOpen ? "x" : "="}
          </span>
        </button>
      </div>
      <nav
        aria-label={t("adminNavigation")}
        className={`${
          isOpen ? "flex" : "hidden"
        } flex-1 flex-col gap-4 md:flex`}
      >
        <Link
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white"
          href="/admin/dashboard"
          onClick={() => setIsOpen(false)}
        >
          {t("dashboard")}
        </Link>
        <Link
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white"
          href="/admin/groups"
          onClick={() => setIsOpen(false)}
        >
          {t("tournamentGroups")}
        </Link>
        <Link
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white"
          href="/"
          onClick={() => setIsOpen(false)}
        >
          {t("publicTournaments")}
        </Link>
      </nav>
      <div
        className={`${isOpen ? "flex" : "hidden"} items-center gap-3 md:flex`}
      >
        <button
          className="self-start rounded-md border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white"
          onClick={() => signOut({ callbackUrl: "/login" })}
          type="button"
        >
          {t("logOut")}
        </button>
        <LocaleToggle className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white" />
        <ThemeToggle className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white" />
      </div>
    </aside>
  );
}
