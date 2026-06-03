import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      mustChangePassword: boolean;
      playerDisplayName?: string;
      playerProfileId?: string;
      role: "admin" | "player";
    } & DefaultSession["user"];
  }

  interface User {
    mustChangePassword: boolean;
    playerDisplayName?: string;
    playerProfileId?: string;
    role: "admin" | "player";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    mustChangePassword?: boolean;
    playerDisplayName?: string;
    playerProfileId?: string;
    role?: "admin" | "player";
  }
}

