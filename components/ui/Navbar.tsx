import Link from "next/link";

interface NavbarProps {
  isAuthenticated: boolean;
  role?: "admin" | "player" | null;
}

export function Navbar({ isAuthenticated, role = null }: NavbarProps) {
  const accountHref = role === "player" ? "/account" : "/admin/dashboard";
  const accountLabel = role === "player" ? "Account" : "Dashboard";

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link className="font-semibold text-slate-900" href="/">
          Raro Volleyball
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link className="text-slate-600 hover:text-slate-900" href="/">
            Tournaments
          </Link>
          <Link className="text-slate-600 hover:text-slate-900" href="/stats">
            Stats
          </Link>
          {!isAuthenticated ? (
            <Link className="text-slate-600 hover:text-slate-900" href="/signup">
              Sign up
            </Link>
          ) : null}
          <Link
            className="rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-700"
            href={isAuthenticated ? accountHref : "/admin/login"}
          >
            {isAuthenticated ? accountLabel : "Admin login"}
          </Link>
        </div>
      </nav>
    </header>
  );
}

