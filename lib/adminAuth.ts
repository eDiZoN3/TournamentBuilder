import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);

  return session?.user.role === "admin";
}

