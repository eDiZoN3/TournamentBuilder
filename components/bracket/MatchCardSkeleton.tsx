"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { useLocale } from "@/components/ui/LocaleProvider";

export function MatchCardSkeleton() {
  const { t } = useLocale();

  return (
    <article
      aria-label={t("loadingMatch")}
      className="w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      data-testid="match-card-skeleton"
      role="status"
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-2 h-3 w-20" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <Skeleton className="mt-4 h-3 w-16" />
    </article>
  );
}

export function BracketSkeleton() {
  const { t } = useLocale();

  return (
    <section aria-label={t("loadingBracket")} className="space-y-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t("loadingBracket")}
      </p>
      <div className="grid min-w-max gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <MatchCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}
