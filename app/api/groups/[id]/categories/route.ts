import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { TournamentGroup } from "@/lib/models/TournamentGroup";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function isValidId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  const { id } = await ctx.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", "VALIDATION_ERROR", 400);
  }

  const { name } = (body as Record<string, unknown>) ?? {};

  if (typeof name !== "string" || name.trim().length === 0) {
    return jsonError("Category name is required", "VALIDATION_ERROR", 400);
  }

  if (!isValidId(id)) {
    return jsonError("Group not found", "NOT_FOUND", 404);
  }

  try {
    await connectDB();

    const group = await TournamentGroup.findById(id);

    if (!group) {
      return jsonError("Group not found", "NOT_FOUND", 404);
    }

    if (group.status !== "draft") {
      return jsonError(
        "Cannot modify categories on a non-draft group",
        "CONFLICT",
        409,
      );
    }

    const maxPosition = group.categories.reduce(
      (max, cat) => Math.max(max, cat.position),
      -1,
    );

    group.categories.push({
      _id: new Types.ObjectId(),
      name: name.trim(),
      position: maxPosition + 1,
      matches: [],
      currentMatchId: null,
    });

    await group.save();

    return NextResponse.json(group.toObject(), { status: 201 });
  } catch {
    return jsonError("Unable to add category", "INTERNAL_ERROR", 500);
  }
}
