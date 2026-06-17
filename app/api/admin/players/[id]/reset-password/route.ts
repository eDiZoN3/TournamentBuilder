import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { playerSummary } from "@/lib/admin/playerAccounts";
import { generateTemporaryPassword } from "@/lib/admin/tempPassword";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { User } from "@/lib/models/User";
import { clientIpFromRequest, rateLimit } from "@/lib/rateLimit";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const ip = clientIpFromRequest(request);

  if (
    !rateLimit(`reset-password:${ip}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    }).allowed
  ) {
    return jsonError("Too many requests", "RATE_LIMITED", 429);
  }

  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  const { id } = await context.params;

  if (!Types.ObjectId.isValid(id)) {
    return jsonError("Player account not found", "NOT_FOUND", 404);
  }

  try {
    await connectDB();

    const profile = await PlayerProfile.findById(id);
    const user = profile
      ? await User.findOne({ _id: profile.userId, role: "player" })
      : null;

    if (!profile || !user) {
      return jsonError("Player account not found", "NOT_FOUND", 404);
    }

    const temporaryPassword = generateTemporaryPassword();

    user.passwordHash = await bcrypt.hash(temporaryPassword, 12);
    user.mustChangePassword = true;
    await user.save();

    return NextResponse.json({
      player: playerSummary(profile, user),
      temporaryPassword,
    });
  } catch {
    return jsonError("Unable to reset player password", "INTERNAL_ERROR", 500);
  }
}
