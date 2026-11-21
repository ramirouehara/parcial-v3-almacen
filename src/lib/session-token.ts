/**
 * El token de sesión: un JWT firmado (HS256) que solo lleva el id del usuario.
 *
 * "Firmado" significa que el servidor le pone un sello con SESSION_SECRET. Si alguien edita
 * la cookie (por ejemplo, cambia el id para hacerse pasar por otro usuario), el sello
 * deja de coincidir y verifySession() la rechaza.
 *
 * El secreto vive SOLO en la variable de entorno SESSION_SECRET, nunca en el
 * repositorio. Este archivo no importa nada de Next.js ni de la base de datos,
 * así el proxy también lo puede usar.
 */
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "almacen_sesion";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 horas: una jornada de trabajo

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

/** Devuelve el id del usuario si el token es válido y no venció; si no, null. */
export async function verifySession(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null; // firma incorrecta, vencido o mal formado
  }
}
