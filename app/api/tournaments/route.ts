import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { Tournament, type TournamentFormat } from "@/lib/models/Tournament";

interface CreateTournamentBody {
  allowSelfJoin: boolean;
  format: TournamentFormat;
  name: string;
  teamSize: 2 | 3 | 4;
  courtsAvailable: number;
  inputMode: "teams" | "players";
}

function parseCreateBody(body: unknown): CreateTournamentBody | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { allowSelfJoin, format, name, teamSize, courtsAvailable, inputMode } =
    body as Record<string, unknown>;
  const parsedAllowSelfJoin =
    typeof allowSelfJoin === "boolean" ? allowSelfJoin : false;
  const parsedFormat =
    format === undefined
      ? "double_elimination"
      : (format as TournamentFormat);

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > 100 ||
    ![2, 3, 4].includes(teamSize as number) ||
    !Number.isInteger(courtsAvailable) ||
    (courtsAvailable as number) < 1 ||
    (courtsAvailable as number) > 10 ||
    !["teams", "players"].includes(inputMode as string) ||
    !["double_elimination", "team_round_robin", "individual_mixer"].includes(
      parsedFormat,
    ) ||
    (parsedFormat === "team_round_robin" && inputMode !== "teams") ||
    (parsedFormat === "individual_mixer" && inputMode !== "players") ||
    (parsedAllowSelfJoin && inputMode !== "players")
  ) {
    return null;
  }

  return {
    allowSelfJoin: parsedAllowSelfJoin,
    format: parsedFormat,
    name: name.trim(),
    teamSize: teamSize as 2 | 3 | 4,
    courtsAvailable: courtsAvailable as number,
    inputMode: inputMode as "teams" | "players",
  };
}

export async function GET() {
  try {
    await connectDB();

    const tournaments = await Tournament.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      tournaments: tournaments.map((tournament) => ({
        _id: tournament._id.toString(),
        name: tournament.name,
        status: tournament.status,
        format: tournament.format ?? "double_elimination",
        createdAt: tournament.createdAt.toISOString(),
        allowSelfJoin: tournament.allowSelfJoin,
        teamCount: tournament.teams.length,
        matchCount: tournament.matches.filter((match) => !match.isBye).length,
      })),
    });
  } catch {
    return jsonError(
      "Unable to load tournaments",
      "INTERNAL_ERROR",
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", "VALIDATION_ERROR", 422);
  }

  const parsedBody = parseCreateBody(body);

  if (!parsedBody) {
    return jsonError("Invalid tournament details", "VALIDATION_ERROR", 422);
  }

  try {
    await connectDB();

    const tournament = await Tournament.create(parsedBody);

    return NextResponse.json(
      {
        _id: tournament._id.toString(),
        name: tournament.name,
        status: tournament.status,
        format: tournament.format,
        teamSize: tournament.teamSize,
        courtsAvailable: tournament.courtsAvailable,
        inputMode: tournament.inputMode,
        allowSelfJoin: tournament.allowSelfJoin,
      },
      {
        status: 201,
      },
    );
  } catch {
    return jsonError(
      "Unable to create tournament",
      "INTERNAL_ERROR",
      500,
    );
  }
}

