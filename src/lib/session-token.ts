/**
 * The session token: a signed JWT (HS256) that only carries the user id.
 *
 * "Signed" means the server stamps it with SESSION_SECRET. If someone edits
 * the cookie (for example, changes the id to become another user), the stamp
 * no longer matches and verifySession() rejects it.
 *
 * The secret lives ONLY in the SESSION_SECRET environment variable, never in
 * the repository. This file imports nothing from Next.js or the database,
 * so the proxy can use it too.
 */
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "almacen_sesion";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours: one working day

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing in .env or has fewer than 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

/** Returns the user id if the token is valid and not expired; otherwise null. */
export async function verifySession(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null; // bad signature, expired or malformed
  }
}
