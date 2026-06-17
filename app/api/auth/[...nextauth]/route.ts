import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NOTE: This login handler is managed entirely by NextAuth and is intentionally
// not wrapped with the in-memory rate limiter. Login attempt throttling for the
// credentials flow should be enforced at the reverse proxy / edge layer
// (e.g. nginx limit_req, Cloudflare rate limiting) in front of this route.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

