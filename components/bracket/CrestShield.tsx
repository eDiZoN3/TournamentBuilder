"use client";

import { useId, type ReactElement } from "react";
import {
  chargeOutline,
  crestColorHex,
  type TeamCrest,
} from "@/lib/crest";

interface CrestShieldProps {
  className?: string;
  crest: TeamCrest;
  /** Rendered pixel size (square-ish). */
  size?: number;
  title?: string;
}

/** Classic escutcheon outline in the 100×116 view box. */
const SHIELD_PATH =
  "M6 6 H94 V60 C94 86 78 100 50 112 C22 100 6 86 6 60 Z";

function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];

  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * index - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return `M${points.join(" L")} Z`;
}

function renderDivision(crest: TeamCrest): ReactElement | null {
  const color = crestColorHex(crest.divisionColor);

  switch (crest.division) {
    case "perPale":
      return <rect x={50} y={0} width={50} height={116} fill={color} />;
    case "perFess":
      return <rect x={0} y={58} width={100} height={58} fill={color} />;
    case "perBend":
      return <polygon points="0,0 100,0 100,116" fill={color} />;
    case "quarterly":
      return (
        <g fill={color}>
          <rect x={0} y={0} width={50} height={58} />
          <rect x={50} y={58} width={50} height={58} />
        </g>
      );
    case "chief":
      return <rect x={0} y={0} width={100} height={30} fill={color} />;
    case "chevron":
      return (
        <path
          d="M0 96 L50 56 L100 96 L100 116 L50 78 L0 116 Z"
          fill={color}
        />
      );
    default:
      return null;
  }
}

function renderCharge(crest: TeamCrest): ReactElement | null {
  if (crest.charge === "none") {
    return null;
  }

  const fill = crestColorHex(crest.chargeColor);
  const stroke = chargeOutline(fill, crestColorHex(crest.field));
  const strokeProps = stroke
    ? { stroke, strokeWidth: 2.5, strokeLinejoin: "round" as const }
    : {};

  const charge = (() => {
    switch (crest.charge) {
      case "cross":
        return (
          <path d="M42 24 H58 V44 H78 V60 H58 V84 H42 V60 H22 V44 H42 Z" />
        );
      case "saltire":
        return (
          <path d="M30 24 L50 44 L70 24 L80 34 L60 54 L80 74 L70 84 L50 64 L30 84 L20 74 L40 54 L20 34 Z" />
        );
      case "mullet":
        return <path d={starPath(50, 54, 30, 12)} />;
      case "lozenge":
        return <path d="M50 22 L74 54 L50 86 L26 54 Z" />;
      case "roundel":
        return <circle cx={50} cy={54} r={26} />;
      case "crescent":
        return (
          <path d="M64 26 A30 30 0 1 0 64 82 A22 22 0 1 1 64 26 Z" />
        );
      case "crown":
        return (
          <g>
            <path d="M24 70 L24 44 L37 58 L50 38 L63 58 L76 46 L76 70 Z" />
            <rect x={22} y={72} width={56} height={11} />
          </g>
        );
      case "fleur":
        return (
          <g>
            <path d="M50 22 C45 32 44 40 50 50 C56 40 55 32 50 22 Z" />
            <path d="M50 48 C40 42 28 46 30 58 C31 68 40 70 46 64 C42 72 47 80 50 80 C53 80 58 72 54 64 C60 70 69 68 70 58 C72 46 60 42 50 48 Z" />
            <rect x={40} y={60} width={20} height={7} />
          </g>
        );
      case "swords":
        return (
          <g>
            <g transform="rotate(45 50 54)">
              <rect x={47} y={24} width={6} height={50} />
              <rect x={42} y={70} width={16} height={6} />
            </g>
            <g transform="rotate(-45 50 54)">
              <rect x={47} y={24} width={6} height={50} />
              <rect x={42} y={70} width={16} height={6} />
            </g>
          </g>
        );
      default:
        return null;
    }
  })();

  if (!charge) {
    return null;
  }

  return (
    <g fill={fill} {...strokeProps}>
      {charge}
    </g>
  );
}

export function CrestShield({
  className,
  crest,
  size = 22,
  title,
}: CrestShieldProps) {
  const clipId = useId();

  return (
    <svg
      aria-hidden={title ? undefined : true}
      className={className}
      height={(size * 116) / 100}
      role={title ? "img" : undefined}
      viewBox="0 0 100 116"
      width={size}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <clipPath id={clipId}>
          <path d={SHIELD_PATH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect
          x={0}
          y={0}
          width={100}
          height={116}
          fill={crestColorHex(crest.field)}
        />
        {renderDivision(crest)}
        {renderCharge(crest)}
      </g>
      <path
        d={SHIELD_PATH}
        fill="none"
        stroke="#3a2a16"
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <path
        d={SHIELD_PATH}
        fill="none"
        stroke="#caa23a"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}
