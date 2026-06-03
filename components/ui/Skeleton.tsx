interface SkeletonProps {
  className?: string;
  "data-testid"?: string;
}

export function Skeleton({
  className = "",
  "data-testid": testId,
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${className}`}
      data-testid={testId}
    />
  );
}
