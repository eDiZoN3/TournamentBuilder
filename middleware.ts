import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin/login") {
    const loginUrl = new URL("/login", request.url);
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");

    if (callbackUrl) {
      loginUrl.searchParams.set("callbackUrl", callbackUrl);
    }

    return NextResponse.redirect(loginUrl);
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token) {
    if (token.mustChangePassword === true && pathname !== "/admin/change-password") {
      const changePasswordUrl = new URL("/admin/change-password", request.url);
      changePasswordUrl.searchParams.set(
        "callbackUrl",
        `${pathname}${request.nextUrl.search}`,
      );

      return NextResponse.redirect(changePasswordUrl);
    }

    const canManageTournaments =
      token.role === "admin" || token.role === "tournament_lead";

    if (pathname !== "/admin/change-password" && !canManageTournaments) {
      return NextResponse.redirect(new URL("/account", request.url));
    }

    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};

