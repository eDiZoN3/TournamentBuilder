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

function renderLowPolyAnimalCharge(charge: string): ReactElement | null {
  const shade = "rgba(255,255,255,0.28)";
  const shadow = "rgba(0,0,0,0.2)";

  switch (charge) {
    case "lion":
      return (
        <g>
          <polygon points="29,28 50,18 72,29 78,54 66,82 50,90 34,82 22,54" />
          <polygon points="35,37 50,28 65,37 62,62 50,74 38,62" fill={shade} />
          <polygon points="40,72 50,86 60,72" fill={shadow} />
        </g>
      );
    case "falcon":
      return (
        <g>
          <polygon points="18,45 48,24 82,44 58,50 50,84 42,50" />
          <polygon points="32,43 48,24 45,62" fill={shade} />
          <polygon points="55,31 82,44 52,47" fill={shadow} />
        </g>
      );
    case "puma":
      return (
        <g>
          <polygon points="18,66 36,42 70,34 84,48 67,56 51,78 28,78" />
          <polygon points="62,28 76,35 70,48 56,42" />
          <polygon points="35,44 70,34 52,57" fill={shade} />
        </g>
      );
    case "panther":
      return (
        <g>
          <polygon points="24,72 34,42 58,30 76,42 78,62 62,80 38,82" />
          <polygon points="34,26 44,40 28,42" />
          <polygon points="66,27 72,44 56,38" />
          <polygon points="40,47 58,36 69,52 52,70" fill={shadow} />
        </g>
      );
    case "lynx":
      return (
        <g>
          <polygon points="28,35 43,42 50,28 57,42 72,35 67,67 50,84 33,67" />
          <polygon points="30,18 38,39 25,32" />
          <polygon points="70,18 62,39 75,32" />
          <polygon points="39,50 50,39 61,50 50,72" fill={shade} />
        </g>
      );
    case "scorpion":
      return (
        <g>
          <polygon points="36,48 50,36 64,48 62,68 50,78 38,68" />
          <polygon points="30,50 15,38 20,58" />
          <polygon points="70,50 85,38 80,58" />
          <polygon points="50,36 60,21 73,20 64,31" />
          <polygon points="50,78 41,90 59,90" fill={shadow} />
        </g>
      );
    case "cobra":
      return (
        <g>
          <polygon points="30,32 50,20 70,32 76,64 61,84 50,72 39,84 24,64" />
          <polygon points="42,36 50,26 58,36 56,66 50,76 44,66" fill={shade} />
          <polygon points="24,64 39,84 33,50" fill={shadow} />
        </g>
      );
    case "koala":
      return (
        <g>
          <polygon points="23,39 37,24 46,41 35,58" />
          <polygon points="77,39 63,24 54,41 65,58" />
          <polygon points="33,42 50,30 67,42 70,66 50,84 30,66" />
          <polygon points="42,58 50,48 58,58 50,70" fill={shadow} />
          <polygon points="36,45 50,34 64,45 50,54" fill={shade} />
        </g>
      );
    case "cheetah":
      return (
        <g>
          <polygon points="18,68 34,42 64,34 82,48 70,61 42,76 24,78" />
          <polygon points="65,27 78,35 72,48 58,41" />
          <circle cx={45} cy={51} r={3} fill={shadow} />
          <circle cx={57} cy={47} r={3} fill={shadow} />
          <circle cx={35} cy={61} r={3} fill={shadow} />
        </g>
      );
    case "jaguar":
      return (
        <g>
          <polygon points="21,70 36,39 62,31 79,43 77,62 55,80 31,81" />
          <polygon points="63,26 77,34 70,46 57,39" />
          <path d="M36 50 L44 44 L52 50 L47 58 L39 58 Z" fill={shadow} />
          <path d="M57 44 L66 42 L70 50 L62 56 L55 52 Z" fill={shadow} />
        </g>
      );
    case "elephant":
      return (
        <g>
          <polygon points="20,52 36,30 64,30 80,52 70,76 50,84 30,76" />
          <polygon points="20,52 5,62 23,72" />
          <polygon points="80,52 95,62 77,72" />
          <polygon points="45,62 55,62 53,92 43,92" />
          <polygon points="35,39 50,32 65,39 50,53" fill={shade} />
        </g>
      );
    case "ram":
      return (
        <g>
          <polygon points="34,42 50,30 66,42 63,68 50,82 37,68" />
          <path d="M35 43 C17 28 17 65 34 58 L31 48 Z" />
          <path d="M65 43 C83 28 83 65 66 58 L69 48 Z" />
          <polygon points="42,50 50,38 58,50 50,68" fill={shade} />
        </g>
      );
    case "fox":
      return (
        <g>
          <polygon points="26,30 44,44 50,26 56,44 74,30 66,66 50,86 34,66" />
          <polygon points="34,62 50,72 66,62 58,82 42,82" fill={shade} />
          <polygon points="43,52 50,44 57,52 50,62" fill={shadow} />
        </g>
      );
    case "hummingbird":
      return (
        <g>
          <polygon points="20,54 50,36 80,28 58,52 46,78" />
          <polygon points="45,39 25,19 38,56" fill={shade} />
          <polygon points="58,44 88,50 55,55" fill={shadow} />
          <polygon points="79,28 95,21 82,36" />
        </g>
      );
    case "leopard":
      return (
        <g>
          <polygon points="22,70 35,42 61,33 78,45 75,64 55,80 30,81" />
          <polygon points="61,26 76,35 68,47 56,39" />
          <circle cx={40} cy={52} r={3} fill={shadow} />
          <circle cx={54} cy={48} r={2.7} fill={shadow} />
          <circle cx={63} cy={58} r={2.8} fill={shadow} />
          <circle cx={34} cy={64} r={2.6} fill={shadow} />
        </g>
      );
    case "toucan":
      return (
        <g>
          <polygon points="33,40 51,25 67,42 60,76 42,84 30,64" />
          <polygon points="58,39 95,31 78,54 57,54" />
          <polygon points="66,39 95,31 74,44" fill={shade} />
          <polygon points="39,49 55,42 53,69 40,77" fill={shadow} />
        </g>
      );
    default:
      return null;
  }
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

  const charge = renderLowPolyAnimalCharge(crest.charge) ?? (() => {
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
    <g color={fill} fill={fill} {...strokeProps}>
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
