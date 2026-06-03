import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { PlayerProfile } from "@/lib/models/PlayerProfile";
import { User } from "@/lib/models/User";

interface SignupBody {
  email: string;
  firstName: string;
  password: string;
  surname?: string;
}

function displayName(firstName: string, surname?: string): string {
  return [firstName, surname].filter(Boolean).join(" ");
}

function playerSummary(profile: {
  _id: { toString(): string };
  userId: { toString(): string };
  displayName: string;
  email: string;
  firstName: string;
  surname?: string | null;
}) {
  return {
    _id: profile._id.toString(),
    userId: profile.userId.toString(),
    firstName: profile.firstName,
    surname: profile.surname ?? undefined,
    displayName: profile.displayName,
    email: profile.email,
  };
}

function parseSignupBody(body: unknown): SignupBody | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const { email, firstName, password, surname } = body as Record<
    string,
    unknown
  >;

  if (
    typeof email !== "string" ||
    typeof firstName !== "string" ||
    typeof password !== "string" ||
    firstName.trim().length === 0 ||
    firstName.trim().length > 50 ||
    password.length < 8 ||
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
    password,
    surname: trimmedSurname || undefined,
  };
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", "VALIDATION_ERROR", 422);
  }

  const parsedBody = parseSignupBody(body);

  if (!parsedBody) {
    return jsonError("Invalid signup details", "VALIDATION_ERROR", 422);
  }

  try {
    await connectDB();

    const existingUser = await User.findOne({ email: parsedBody.email });

    if (existingUser) {
      return jsonError("Email already registered", "CONFLICT", 409);
    }

    const user = await User.create({
      email: parsedBody.email,
      passwordHash: await bcrypt.hash(parsedBody.password, 12),
      role: "player",
    });
    const profile = await PlayerProfile.create({
      userId: user._id,
      firstName: parsedBody.firstName,
      surname: parsedBody.surname,
      displayName: displayName(parsedBody.firstName, parsedBody.surname),
      email: parsedBody.email,
    });

    return NextResponse.json(
      {
        player: playerSummary(profile),
      },
      {
        status: 201,
      },
    );
  } catch {
    return jsonError("Unable to create player account", "INTERNAL_ERROR", 500);
  }
}
