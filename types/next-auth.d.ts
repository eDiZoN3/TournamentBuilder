import type { DefaultSession } from "next-auth";

type UserRole = "admin" | "tournament_lead" | "player";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      mustChangePassword: boolean;
      playerDisplayName?: string;
      playerProfileId?: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    mustChangePassword: boolean;
    playerDisplayName?: string;
    playerProfileId?: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    mustChangePassword?: boolean;
    playerDisplayName?: string;
    playerProfileId?: string;
    role?: UserRole;
  }
}

