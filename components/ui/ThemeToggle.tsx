"use client";

import { useTheme } from "@/components/ui/ThemeProvider";
import { useLocale } from "@/components/ui/LocaleProvider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label =
    nextTheme === "dark" ? t("switchToDarkMode") : t("switchToLightMode");

  return (
    <button
      aria-label={label}
      aria-pressed={theme === "dark"}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-slate-600 ${className}`}
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      {theme === "dark" ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 rounded-full bg-amber-300 shadow-[0_0_0_2px_rgba(252,211,77,0.25),0_0_12px_rgba(252,211,77,0.6)]"
        />
      ) : (
        <span
          aria-hidden="true"
          className="relative h-4 w-4 overflow-hidden rounded-full bg-slate-700"
        >
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-white" />
        </span>
      )}
    </button>
  );
}
