"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AdminSidebar() {
  return (
    <aside className="flex w-full flex-col gap-6 border-b border-slate-800 bg-slate-900 px-4 py-5 text-white md:min-h-screen md:w-64 md:border-b-0">
      <Link className="text-lg font-semibold" href="/admin/dashboard">
        Tournament Admin
      </Link>
      <nav className="flex flex-1 gap-4 md:flex-col">
        <Link
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white"
          href="/admin/dashboard"
        >
          Dashboard
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        <button
          className="self-start rounded-md border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          type="button"
        >
          Log out
        </button>
        <ThemeToggle className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white" />
      </div>
    </aside>
  );
}
