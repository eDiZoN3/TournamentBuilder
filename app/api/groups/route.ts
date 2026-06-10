import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { TournamentGroup } from "@/lib/models/TournamentGroup";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  try {
    await connectDB();

    const groups = await TournamentGroup.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      groups: groups.map((g) => ({
        _id: g._id.toString(),
        name: g.name,
        status: g.status,
        teamCount: g.teams.length,
        categoryCount: g.categories.length,
        createdAt: g.createdAt.toISOString(),
      })),
    });
  } catch {
    return jsonError("Unable to load groups", "INTERNAL_ERROR", 500);
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
    return jsonError("Invalid request body", "VALIDATION_ERROR", 400);
  }

  const { name } = (body as Record<string, unknown>) ?? {};

  if (typeof name !== "string" || name.trim().length === 0) {
    return jsonError("Group name is required", "VALIDATION_ERROR", 400);
  }

  try {
    await connectDB();

    const group = await TournamentGroup.create({ name: name.trim() });

    return NextResponse.json(
      {
        _id: group._id.toString(),
        name: group.name,
        status: group.status,
        teams: group.teams,
        categories: group.categories,
        createdAt: group.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch {
    return jsonError("Unable to create group", "INTERNAL_ERROR", 500);
  }
}
