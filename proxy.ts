import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (!isProtected) return NextResponse.next();

  // better-auth stores the session token in this cookie
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files, _next internals, and the auth
     * routes themselves to avoid redirect loops.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|auth).*)",
  ],
};
