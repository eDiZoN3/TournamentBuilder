import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, requireStrictAdmin } from "@/lib/adminAuth";
import { displayName, getPlayerUserSummaries, playerSummary } from "@/lib/admin/playerAccounts";
import { generateTemporaryPassword } from "@/lib/admin/tempPassword";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { User } from "@/lib/models/User";

interface CreatePlayerBody {
  email: string;
  firstName: string;
  surname?: string;
}

function parseCreateBody(body: unknown): CreatePlayerBody | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const { email, firstName, surname } = body as Record<string, unknown>;

  if (
    typeof email !== "string" ||
    typeof firstName !== "string" ||
    firstName.trim().length === 0 ||
    firstName.trim().length > 50 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase()) ||
    (surname !== undefined &&
      (typeof surname !== "string" || surname.trim().length > 50))
  ) {
    return null;
  }

  const trimmedSurname = typeof surname === "string" ? surname.trim() : "";

  return {
    email: email.trim().toLowerCase(),
    firstName: firstName.trim(),
    surname: trimmedSurname || undefined,
  };
}

export async function GET() {
  if (!(await requireStrictAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  try {
    await connectDB();

    return NextResponse.json({
      players: await getPlayerUserSummaries(),
    });
  } catch {
    return jsonError("Unable to load player accounts", "INTERNAL_ERROR", 500);
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
    return jsonError("Invalid player details", "VALIDATION_ERROR", 422);
  }

  try {
    await connectDB();

    const existingUser = await User.findOne({ email: parsedBody.email });

    if (existingUser) {
      return jsonError("Email already registered", "CONFLICT", 409);
    }

    const temporaryPassword = generateTemporaryPassword();
    const user = await User.create({
      email: parsedBody.email,
      mustChangePassword: true,
      passwordHash: await bcrypt.hash(temporaryPassword, 12),
      role: "player",
    });

    try {
      const profile = await PlayerProfile.create({
        userId: user._id,
        firstName: parsedBody.firstName,
        surname: parsedBody.surname,
        displayName: displayName(parsedBody.firstName, parsedBody.surname),
        email: parsedBody.email,
      });

      return NextResponse.json(
        {
          player: playerSummary(profile, user),
          temporaryPassword,
        },
        {
          status: 201,
        },
      );
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  } catch {
    return jsonError("Unable to create player account", "INTERNAL_ERROR", 500);
  }
}
