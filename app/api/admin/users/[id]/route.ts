import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdminSession } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession();

  if (!session) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  if (session.user.role !== "admin") {
    return jsonError(
      "Only admins can remove tournament leads",
      "FORBIDDEN",
      403,
    );
  }

  const { id } = await context.params;

  if (!Types.ObjectId.isValid(id)) {
    return jsonError("Tournament lead not found", "NOT_FOUND", 404);
  }

  if (id === session.user.id) {
    return jsonError(
      "Admins cannot remove their active session",
      "CONFLICT",
      409,
    );
  }

  try {
    await connectDB();

    const user = await User.findById(id);

    if (!user || user.role !== "tournament_lead") {
      return jsonError("Tournament lead not found", "NOT_FOUND", 404);
    }

    await user.deleteOne();

    return new NextResponse(null, {
      status: 204,
    });
  } catch {
    return jsonError("Unable to remove tournament lead", "INTERNAL_ERROR", 500);
  }
}
