/**
 * Session cookie for pages, route handlers and server actions.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { resolveSessionUser } from "@/services/auth";
import type { AuthUser } from "@/services/permissions";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signSession, verifySession } from "./session-token";

/** Called after a successful login: writes the signed cookie. */
export async function startSession(userId: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await signSession(userId), {
    httpOnly: true, // JavaScript in the browser cannot read it (§8 Seguridad)
    sameSite: "lax", // §11.1
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Logout: deletes the cookie. */
export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * The logged-in user, looked up in the database (§10.5), or null.
 * `cache` makes the layout and the page of the same request share ONE query.
 */
export const getSessionUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const userId = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  return resolveSessionUser(userId);
});

/** Second barrier of §10.5: every page checks that there is a valid user. */
export async function requirePageUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
