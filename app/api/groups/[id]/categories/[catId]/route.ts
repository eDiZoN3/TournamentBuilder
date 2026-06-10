import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { TournamentGroup } from "@/lib/models/TournamentGroup";

interface RouteContext {
  params: Promise<{ id: string; catId: string }>;
}

function isValidId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

async function loadDraftGroup(id: string) {
  if (!isValidId(id)) return { group: null, error: "NOT_FOUND" as const };
  await connectDB();
  const group = await TournamentGroup.findById(id);
  if (!group) return { group: null, error: "NOT_FOUND" as const };
  if (group.status !== "draft") return { group: null, error: "CONFLICT" as const };
  return { group, error: null };
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  const { id, catId } = await ctx.params;
  const { group, error } = await loadDraftGroup(id);

  if (error === "NOT_FOUND") {
    return jsonError("Group not found", "NOT_FOUND", 404);
  }

  if (error === "CONFLICT") {
    return jsonError("Cannot modify categories on a non-draft group", "CONFLICT", 409);
  }

  const catIndex = group!.categories.findIndex(
    (c) => c._id.toString() === catId,
  );

  if (catIndex === -1) {
    return jsonError("Category not found", "NOT_FOUND", 404);
  }

  group!.categories.splice(catIndex, 1);
  await group!.save();

  return NextResponse.json(group!.toObject());
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  const { id, catId } = await ctx.params;

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

  const { group, error } = await loadDraftGroup(id);

  if (error === "NOT_FOUND") {
    return jsonError("Group not found", "NOT_FOUND", 404);
  }

  if (error === "CONFLICT") {
    return jsonError("Cannot modify categories on a non-draft group", "CONFLICT", 409);
  }

  const cat = group!.categories.find((c) => c._id.toString() === catId);

  if (!cat) {
    return jsonError("Category not found", "NOT_FOUND", 404);
  }

  cat.name = name.trim();
  await group!.save();

  return NextResponse.json(group!.toObject());
}
