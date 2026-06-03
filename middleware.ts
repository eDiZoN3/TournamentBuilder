import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin/login") {
    return NextResponse.next();
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

    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};

