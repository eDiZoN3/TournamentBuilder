import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      mustChangePassword: boolean;
      role: "admin";
    } & DefaultSession["user"];
  }

  interface User {
    mustChangePassword: boolean;
    role: "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    mustChangePassword?: boolean;
    role?: "admin";
  }
}

