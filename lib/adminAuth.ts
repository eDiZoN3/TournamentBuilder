import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);

  return session?.user.role === "admin" ? session : null;
}

export async function requirePlayerSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);

  return session?.user.role === "player" ? session : null;
}

export async function requireAdmin(): Promise<boolean> {
  return Boolean(await requireAdminSession());
}

