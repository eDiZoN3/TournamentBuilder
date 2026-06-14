"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { useLocale } from "@/components/ui/LocaleProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AdminSidebar() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopSidebarHidden, setIsDesktopSidebarHidden] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const canHideDesktopSidebar = /^\/admin\/tournament\/[^/]+\/manage$/.test(
    pathname ?? "",
  );

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
    <>
      {canHideDesktopSidebar && isDesktopSidebarHidden ? (
        <button
          aria-label={t("showAdminSidebar")}
          className="fixed left-3 top-3 z-50 hidden h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 md:flex"
          onClick={() => setIsDesktopSidebarHidden(false)}
          title={t("showAdminSidebar")}
          type="button"
        >
          <span aria-hidden="true">›</span>
        </button>
      ) : null}
      <aside
        className={`sticky top-0 z-40 flex w-full flex-col gap-4 border-b border-slate-800 bg-slate-900 px-4 py-5 text-white md:h-screen md:w-64 md:self-start md:overflow-y-auto md:border-b-0 ${
          canHideDesktopSidebar && isDesktopSidebarHidden ? "md:hidden" : ""
        }`}
        data-testid="admin-sidebar"
        ref={sidebarRef}
      >
      <div className="flex items-center justify-between gap-3">
        <Link className="text-lg font-semibold" href="/admin/dashboard">
          {t("tournamentAdmin")}
        </Link>
        <div className="flex items-center gap-2">
        {canHideDesktopSidebar ? (
          <button
            aria-label={t("hideAdminSidebar")}
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-slate-600 text-slate-200 transition hover:bg-slate-800 hover:text-white md:inline-flex"
            onClick={() => setIsDesktopSidebarHidden(true)}
            title={t("hideAdminSidebar")}
            type="button"
          >
            <span aria-hidden="true">‹</span>
          </button>
        ) : null}
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
      </div>
      <nav
        aria-label={t("adminNavigation")}
        className={`${
          isOpen ? "flex" : "hidden"
        } flex-1 flex-col gap-4 md:flex`}
      >
        <Link
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          href="/admin/dashboard"
          onClick={() => setIsOpen(false)}
        >
          {t("dashboard")}
        </Link>
        <Link
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
          className="self-start rounded-md border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          onClick={() => signOut({ callbackUrl: "/login", redirect: true })}
          type="button"
        >
          {t("logOut")}
        </button>
        <LocaleToggle className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white" />
        <ThemeToggle className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white" />
      </div>
      </aside>
    </>
  );
}
