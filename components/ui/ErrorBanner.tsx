"use client";

import { useState } from "react";

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
      role="status"
    >
      <span>{message}</span>
      <button
        aria-label="Dismiss error"
        className="rounded-md border border-amber-300 px-2 py-1 text-xs font-semibold dark:border-amber-600"
        onClick={() => {
          setIsVisible(false);
          onDismiss?.();
        }}
        type="button"
      >
        Dismiss
      </button>
    </div>
  );
}
