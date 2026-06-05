import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { StatsReset, type StatsResetScope } from "@/lib/models/StatsReset";
import { Tournament } from "@/lib/models/Tournament";
import { normalizeName } from "@/lib/stats";

const CONFIRMATION_PHRASE = "RESET STATS";

type ParsedReset =
  | {
      scope: "player";
      playerProfileId: string;
    }
  | {
      scope: "tournament";
      tournamentId: string;
    }
  | {
      scope: "season";
      season: number;
    }
  | {
      scope: "all";
    };

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidSeason(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1900 &&
    value <= 3000
  );
}

function parseResetBody(body: unknown): ParsedReset | null {
  if (!isObject(body) || body.confirmation !== CONFIRMATION_PHRASE) {
    return null;
  }

  if (body.scope === "player" && typeof body.playerProfileId === "string") {
    return {
      scope: "player",
      playerProfileId: body.playerProfileId,
    };
  }

  if (body.scope === "tournament" && typeof body.tournamentId === "string") {
    return {
      scope: "tournament",
      tournamentId: body.tournamentId,
    };
  }

  if (body.scope === "season" && isValidSeason(body.season)) {
    return {
      scope: "season",
      season: body.season,
    };
  }

  if (body.scope === "all") {
    return {
      scope: "all",
    };
  }

  return null;
}

function seasonRange(season: number) {
  return {
    start: new Date(Date.UTC(season, 0, 1)),
    end: new Date(Date.UTC(season + 1, 0, 1)),
  };
}

function resetKey(parsed: ParsedReset): string {
  if (parsed.scope === "player") {
    return `player:${parsed.playerProfileId}`;
  }

  if (parsed.scope === "tournament") {
    return `tournament:${parsed.tournamentId}`;
  }

  if (parsed.scope === "season") {
    return `season:${parsed.season}`;
  }

  return "all";
}

function resetSummary(reset: {
  _id: { toString(): string };
  createdAt: Date;
  playerProfileId?: Types.ObjectId | null;
  resetKey: string;
  scope: StatsResetScope;
  season?: number | null;
  tournamentId?: Types.ObjectId | null;
}) {
  return {
    _id: reset._id.toString(),
    resetKey: reset.resetKey,
    scope: reset.scope,
    playerProfileId: reset.playerProfileId?.toString(),
    tournamentId: reset.tournamentId?.toString(),
    season: reset.season ?? undefined,
    createdAt: reset.createdAt.toISOString(),
  };
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();

  if (!session) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  if (session.user.role !== "admin") {
    return jsonError("Only admins can reset stats", "FORBIDDEN", 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", "VALIDATION_ERROR", 422);
  }

  const parsed = parseResetBody(body);

  if (!parsed) {
    return jsonError("Invalid stats reset payload", "VALIDATION_ERROR", 422);
  }

  try {
    await connectDB();

    const baseReset = {
      createdBy: session.user.id,
      playerNameKey: null,
      playerProfileId: null,
      resetKey: resetKey(parsed),
      scope: parsed.scope,
      season: null,
      tournamentId: null,
    };
    let affectedTournaments = 0;

    if (parsed.scope === "player") {
      if (!Types.ObjectId.isValid(parsed.playerProfileId)) {
        return jsonError("Invalid stats reset payload", "VALIDATION_ERROR", 422);
      }

      const profile = await PlayerProfile.findById(parsed.playerProfileId).lean();

      if (!profile) {
        return jsonError("Invalid stats reset payload", "VALIDATION_ERROR", 422);
      }

      Object.assign(baseReset, {
        playerNameKey: normalizeName(profile.displayName),
        playerProfileId: profile._id,
      });
    }

    if (parsed.scope === "tournament") {
      if (!Types.ObjectId.isValid(parsed.tournamentId)) {
        return jsonError("Invalid stats reset payload", "VALIDATION_ERROR", 422);
      }

      const tournament = await Tournament.findById(parsed.tournamentId).lean();

      if (!tournament) {
        return jsonError("Invalid stats reset payload", "VALIDATION_ERROR", 422);
      }

      Object.assign(baseReset, {
        tournamentId: tournament._id,
      });
      affectedTournaments = 1;
    }

    if (parsed.scope === "season") {
      const { start, end } = seasonRange(parsed.season);

      Object.assign(baseReset, {
        season: parsed.season,
      });
      affectedTournaments = await Tournament.countDocuments({
        createdAt: {
          $gte: start,
          $lt: end,
        },
      });
    }

    if (parsed.scope === "all") {
      affectedTournaments = await Tournament.countDocuments();
    }

    const reset = await StatsReset.findOneAndUpdate(
      {
        resetKey: baseReset.resetKey,
      },
      {
        $set: baseReset,
      },
      {
        new: true,
        setDefaultsOnInsert: true,
        upsert: true,
      },
    );

    return NextResponse.json({
      reset: resetSummary(reset),
      affectedTournaments,
    });
  } catch {
    return jsonError("Unable to reset stats", "INTERNAL_ERROR", 500);
  }
}
