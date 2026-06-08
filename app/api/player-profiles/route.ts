import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedSession } from "@/lib/adminAuth";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { searchPlayerProfiles } from "@/lib/playerProfiles";

const allowedRoles = new Set(["admin", "tournament_lead", "player"]);

export async function GET(request: NextRequest) {
  const session = await requireAuthenticatedSession();

  if (!session || !allowedRoles.has(session.user.role)) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    return NextResponse.json({
      players: await searchPlayerProfiles(
        searchParams.get("q"),
        searchParams.get("limit"),
      ),
    });
  } catch {
    return jsonError("Unable to search player profiles", "INTERNAL_ERROR", 500);
  }
}
