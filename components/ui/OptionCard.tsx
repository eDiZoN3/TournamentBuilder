import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface OptionCardProps {
  /** Accessible name — kept separate from the description for screen readers. */
  title: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  /** Radios share a `name`; checkboxes can omit it. */
  name?: string;
  type?: "radio" | "checkbox";
  disabled?: boolean;
  /** Optional leading visual (emoji, badge, icon). */
  icon?: ReactNode;
}

/**
 * A radio/checkbox rendered as a selectable card with a title and optional
 * description. The native control keeps an explicit `aria-label` so assistive
 * tech (and tests) reference the option by its title, not the longer body text.
 */
export function OptionCard({
  title,
  description,
  checked,
  onChange,
  name,
  type = "radio",
  disabled = false,
  icon,
}: OptionCardProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
        checked
          ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900 dark:border-white dark:bg-slate-800 dark:ring-white"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-800/50",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
      )}
    >
      <input
        aria-label={title}
        checked={checked}
        className="mt-0.5"
        disabled={disabled}
        name={name}
        onChange={onChange}
        type={type}
      />
      {icon ? (
        <span aria-hidden="true" className="text-lg leading-none">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-900 dark:text-white">
          {title}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
