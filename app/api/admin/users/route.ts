import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

const TEMPORARY_PASSWORD_LENGTH = 10;
const TEMPORARY_PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

interface CreateAdminBody {
  email: string;
}

function adminSummary(admin: {
  _id: { toString(): string };
  createdAt: Date;
  email: string;
  mustChangePassword: boolean;
}) {
  return {
    _id: admin._id.toString(),
    email: admin.email,
    mustChangePassword: admin.mustChangePassword,
    createdAt: admin.createdAt.toISOString(),
  };
}

function generateTemporaryPassword(): string {
  let password = "";

  for (let index = 0; index < TEMPORARY_PASSWORD_LENGTH; index += 1) {
    password +=
      TEMPORARY_PASSWORD_CHARS[
        randomInt(TEMPORARY_PASSWORD_CHARS.length)
      ];
  }

  return password;
}

function parseCreateBody(body: unknown): CreateAdminBody | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const { email } = body as Record<string, unknown>;

  if (typeof email !== "string") {
    return null;
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return null;
  }

  return {
    email: trimmedEmail,
  };
}

export async function GET() {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  try {
    await connectDB();

    const admins = await User.find({ role: "admin" }).sort({ createdAt: -1 });

    return NextResponse.json({
      admins: admins.map(adminSummary),
    });
  } catch {
    return jsonError("Unable to load admin accounts", "INTERNAL_ERROR", 500);
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
    return jsonError("Invalid admin email", "VALIDATION_ERROR", 422);
  }

  try {
    await connectDB();

    const existingAdmin = await User.findOne({ email: parsedBody.email });

    if (existingAdmin) {
      return jsonError("Admin email already exists", "CONFLICT", 409);
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const admin = await User.create({
      email: parsedBody.email,
      mustChangePassword: true,
      passwordHash,
      role: "admin",
    });

    return NextResponse.json(
      {
        admin: adminSummary(admin),
        temporaryPassword,
      },
      {
        status: 201,
      },
    );
  } catch {
    return jsonError("Unable to create admin account", "INTERNAL_ERROR", 500);
  }
}
