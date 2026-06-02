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
      className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
      role="status"
    >
      <span>{message}</span>
      <button
        aria-label="Dismiss error"
        className="rounded-md border border-amber-300 px-2 py-1 text-xs font-semibold"
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
