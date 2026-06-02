import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { User } from "../lib/models/User";

export async function seedAdmin(
  email: string,
  password: string,
): Promise<"created" | "exists"> {
  const normalizedEmail = email.trim().toLowerCase();
  const existingAdmin = await User.findOne({ email: normalizedEmail });

  if (existingAdmin) {
    return "exists";
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    email: normalizedEmail,
    passwordHash,
    role: "admin",
  });

  return "created";
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured");
  }

  await connectDB();

  const result = await seedAdmin(email, password);
  const message =
    result === "created"
      ? `Created admin user: ${email.trim().toLowerCase()}`
      : `Admin user already exists: ${email.trim().toLowerCase()}`;

  console.log(message);
}

if (process.argv[1]?.endsWith("seed-admin.ts")) {
  main()
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}

