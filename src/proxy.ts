/**
 * First barrier of §10.5. Next.js runs this BEFORE rendering any page.
 * Without a valid signed cookie, the user is sent to /login.
 *
 * It is a quick check only. Pages look up the user in the database again
 * (barrier 2) and services check the role (barrier 3).
 * The API is excluded: its wrapper (src/lib/api.ts) answers 401 as JSON.
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

export async function proxy(request: NextRequest) {
  const userId = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!userId && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (userId && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url)); // already logged in
  }
  return NextResponse.next();
}

export const config = {
  // Every path except the API, Next's own files and images.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
