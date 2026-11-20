/**
 * Authentication service: login, session user and password change (RF-U1, RF-U2, RF-U5).
 * It knows nothing about cookies or HTTP: that is the adapters' job (§10.1).
 */
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { usuarios, type Usuario } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import { changePasswordSchema, loginSchema } from "@/schemas/auth";
import type { AuthUser } from "./permissions";

/** Passwords are stored only as bcrypt hashes (§8 Seguridad). */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

const toAuthUser = (u: Usuario): AuthUser => ({
  id: u.id,
  nombre: u.nombre,
  email: u.email,
  rol: u.rol,
});

/**
 * RF-U1: checks email and password.
 * Wrong email, wrong password and inactive user (RF-U4) give the SAME
 * error, so nobody can find out which emails exist (§11.3).
 */
export async function login(input: unknown): Promise<AuthUser> {
  const { email, password } = parseInput(loginSchema, input);
  const user = await db.query.usuarios.findFirst({ where: eq(usuarios.email, email) });
  const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !user.activo || !passwordOk) {
    throw new ApiError(401, "CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos.");
  }
  return toAuthUser(user);
}

/**
 * RF-U2 / §10.5: the user is looked up in the database on EVERY request.
 * If an admin deactivates them, they lose access at once, even with a valid cookie.
 */
export async function resolveSessionUser(userId: number | null): Promise<AuthUser | null> {
  if (userId === null) return null;
  const user = await db.query.usuarios.findFirst({
    where: and(eq(usuarios.id, userId), eq(usuarios.activo, true)),
  });
  return user ? toAuthUser(user) : null;
}

/** RF-U5: each user changes their own password, confirming the current one. */
export async function changePassword(user: AuthUser, input: unknown): Promise<void> {
  const { actual, nueva } = parseInput(changePasswordSchema, input);
  const row = await db.query.usuarios.findFirst({ where: eq(usuarios.id, user.id) });
  if (!row || !(await bcrypt.compare(actual, row.passwordHash))) {
    throw new ApiError(422, "CONTRASENA_ACTUAL_INCORRECTA", "La contraseña actual no es correcta.", [
      { campo: "actual", mensaje: "La contraseña actual no es correcta." },
    ]);
  }
  await db
    .update(usuarios)
    .set({ passwordHash: await hashPassword(nueva) })
    .where(eq(usuarios.id, user.id));
}
