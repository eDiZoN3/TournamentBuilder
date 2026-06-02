"use client";

import {
  useEffect,
  useState,
  type RefObject,
} from "react";
import { idString } from "@/components/bracket/utils";
import type { IMatch } from "@/lib/models/Tournament";

interface ConnectorLinesProps {
  containerRef: RefObject<HTMLElement | null>;
  matches: IMatch[];
}

interface Route {
  highlighted: boolean;
  key: string;
  sourceId: string;
  targetId: string;
}

interface Line extends Route {
  path: string;
}

export function routesFor(matches: IMatch[]): Route[] {
  return matches.flatMap((match) => {
    const sourceId = idString(match._id);
    const highlighted = match.status === "in_progress";
    const routes: Route[] = [];

    if (match.winnerNextMatchId) {
      routes.push({
        highlighted,
        key: `${sourceId}-winner-${idString(match.winnerNextMatchId)}`,
        sourceId,
        targetId: idString(match.winnerNextMatchId),
      });
    }

    if (match.loserNextMatchId) {
      routes.push({
        highlighted,
        key: `${sourceId}-loser-${idString(match.loserNextMatchId)}`,
        sourceId,
        targetId: idString(match.loserNextMatchId),
      });
    }

    return routes;
  });
}

export function calculateLines(container: HTMLElement, routes: Route[]): Line[] {
  const containerRect = container.getBoundingClientRect();

  return routes.flatMap((route) => {
    const source = document.getElementById(`match-${route.sourceId}`);
    const target = document.getElementById(`match-${route.targetId}`);

    if (!source || !target) {
      return [];
    }

    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const startX = sourceRect.right - containerRect.left + container.scrollLeft;
    const startY =
      sourceRect.top -
      containerRect.top +
      container.scrollTop +
      sourceRect.height / 2;
    const endX = targetRect.left - containerRect.left + container.scrollLeft;
    const endY =
      targetRect.top -
      containerRect.top +
      container.scrollTop +
      targetRect.height / 2;
    const controlOffset = Math.max(24, Math.abs(endX - startX) / 2);

    return [
      {
        ...route,
        path: `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${
          endX - controlOffset
        } ${endY}, ${endX} ${endY}`,
      },
    ];
  });
}

export function ConnectorLines({ containerRef, matches }: ConnectorLinesProps) {
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const update = () => {
      setLines(calculateLines(container, routesFor(matches)));
    };
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(update);

    update();
    observer?.observe(container);
    container
      .querySelectorAll<HTMLElement>("[data-match-id]")
      .forEach((card) => observer?.observe(card));
    window.addEventListener("resize", update);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [containerRef, matches]);

  if (lines.length === 0) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
    >
      {lines.map((line) => (
        <path
          className={
            line.highlighted
              ? "fill-none stroke-amber-400"
              : "fill-none stroke-slate-300"
          }
          d={line.path}
          data-testid="connector-line"
          key={line.key}
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}
