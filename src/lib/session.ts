/**
 * Cookie de sesión para páginas, route handlers y server actions.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { resolveSessionUser } from "@/services/auth";
import type { AuthUser } from "@/services/permissions";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signSession, verifySession } from "./session-token";

/** Se llama después de un login correcto: escribe la cookie firmada. */
export async function startSession(userId: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await signSession(userId), {
    httpOnly: true, // el JavaScript del navegador no la puede leer (§8 Seguridad)
    sameSite: "lax", // §11.1
    secure: process.env.NODE_ENV === "production", // solo por HTTPS en producción
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Logout: borra la cookie. */
export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * El usuario logueado, buscado en la base de datos (§10.5), o null.
 * `cache` hace que el layout y la página del mismo pedido compartan UNA sola consulta.
 */
export const getSessionUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const userId = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  return resolveSessionUser(userId);
});

/** Segunda barrera del §10.5: cada página comprueba que haya un usuario válido. */
export async function requirePageUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
