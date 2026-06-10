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

async function findGroup(id: string) {
  if (!isValidId(id)) return null;
  await connectDB();
  return TournamentGroup.findById(id);
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  try {
    const group = await findGroup(id);

    if (!group) {
      return jsonError("Group not found", "NOT_FOUND", 404);
    }

    return NextResponse.json(group.toObject());
  } catch {
    return jsonError("Unable to load group", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  const { id } = await ctx.params;

  try {
    const group = await findGroup(id);

    if (!group) {
      return jsonError("Group not found", "NOT_FOUND", 404);
    }

    if (group.status === "active") {
      return jsonError(
        "Cannot delete an active group",
        "CONFLICT",
        409,
      );
    }

    await group.deleteOne();

    return new NextResponse(null, { status: 204 });
  } catch {
    return jsonError("Unable to delete group", "INTERNAL_ERROR", 500);
  }
}
