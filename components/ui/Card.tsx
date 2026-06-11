import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Shared surface styling for panels, cards and form containers. */
export const cardSurface =
  "rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover affordance for clickable cards. */
  interactive?: boolean;
  /** Renders the dashed, centered empty-state look. */
  muted?: boolean;
}

export function Card({
  className,
  interactive,
  muted,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        muted
          ? "rounded-xl border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
          : cardSurface,
        "p-5",
        interactive &&
          "transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-500",
        className,
      )}
      {...props}
    />
  );
}
