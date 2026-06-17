import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAuthenticatedSession } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { clientIpFromRequest, rateLimit } from "@/lib/rateLimit";

// bcryptjs silently truncates passwords at 72 bytes; reject longer ones.
const MAX_PASSWORD_LENGTH = 72;

interface ChangePasswordBody {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
}

function parseChangePasswordBody(body: unknown): ChangePasswordBody | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const { confirmPassword, currentPassword, newPassword } = body as Record<
    string,
    unknown
  >;

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string" ||
    currentPassword.length === 0 ||
    newPassword.length < 8 ||
    newPassword.length > MAX_PASSWORD_LENGTH ||
    newPassword !== confirmPassword
  ) {
    return null;
  }

  return {
    confirmPassword,
    currentPassword,
    newPassword,
  };
}

export async function POST(request: NextRequest) {
  const ip = clientIpFromRequest(request);

  if (
    !rateLimit(`change-password:${ip}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    }).allowed
  ) {
    return jsonError("Too many requests", "RATE_LIMITED", 429);
  }

  // NOTE: this route reads the session directly via
  // requireAuthenticatedSession (NOT requireAdminSession), so it stays callable
  // while mustChangePassword is true — otherwise a forced-reset user could
  // never recover their account.
  const session = await requireAuthenticatedSession();

  if (!session) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", "VALIDATION_ERROR", 422);
  }

  const parsedBody = parseChangePasswordBody(body);

  if (!parsedBody) {
    return jsonError("Invalid password change", "VALIDATION_ERROR", 422);
  }

  try {
    await connectDB();

    const admin = await User.findById(session.user.id);

    if (!admin) {
      return jsonError("Account not found", "NOT_FOUND", 404);
    }

    const currentPasswordMatches = await bcrypt.compare(
      parsedBody.currentPassword,
      admin.passwordHash,
    );

    if (!currentPasswordMatches) {
      return jsonError("Current password is incorrect", "CONFLICT", 409);
    }

    admin.passwordHash = await bcrypt.hash(parsedBody.newPassword, 12);
    admin.mustChangePassword = false;
    await admin.save();

    return NextResponse.json({
      mustChangePassword: admin.mustChangePassword,
      role: admin.role,
    });
  } catch {
    return jsonError("Unable to change password", "INTERNAL_ERROR", 500);
  }
}
