import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireAuthenticatedSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * A forced password change (temporary password) gates all role-based API
 * access: the middleware redirects every /admin page to /admin/change-password,
 * and these guards block the equivalent /api surface so a temp-password account
 * cannot act before completing the change. The change-password route itself
 * uses requireAuthenticatedSession (not these guards), so recovery stays open.
 */
function hasPendingPasswordChange(session: Session | null): boolean {
  return Boolean(session?.user.mustChangePassword);
}

export async function requireAdminSession(): Promise<Session | null> {
  const session = await requireAuthenticatedSession();

  if (hasPendingPasswordChange(session)) {
    return null;
  }

  return session?.user.role === "admin" ||
    session?.user.role === "tournament_lead"
    ? session
    : null;
}

export async function requirePlayerSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);

  if (hasPendingPasswordChange(session)) {
    return null;
  }

  return session?.user.role === "player" ? session : null;
}

export async function requireAdmin(): Promise<boolean> {
  return Boolean(await requireAdminSession());
}

/**
 * True only for the full `admin` role (not `tournament_lead`). Used to gate
 * the user/player account listings, which expose other accounts' emails.
 */
export async function requireStrictAdmin(): Promise<boolean> {
  const session = await requireAdminSession();

  return session?.user.role === "admin";
}

