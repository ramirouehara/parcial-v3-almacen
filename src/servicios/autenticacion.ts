/**
 * Servicio de autenticación: login, usuario de la sesión y cambio de contraseña (RF-U1, RF-U2, RF-U5).
 * No sabe nada de cookies ni de HTTP: eso es trabajo de los adaptadores (§10.1).
 */
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/conexion";
import { usuarios, type Usuario } from "@/db/esquema";
import { ApiError } from "@/lib/errores";
import { parseInput } from "@/lib/validacion";
import { changePasswordSchema, loginSchema } from "@/esquemas/autenticacion";
import type { AuthUser } from "./permisos";

/** Las contraseñas se guardan solo como hash bcrypt (§8 Seguridad). */
export function hashearContrasena(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

const toAuthUser = (u: Usuario): AuthUser => ({
  id: u.id,
  nombre: u.nombre,
  email: u.email,
  rol: u.rol,
});

/**
 * RF-U1: comprueba email y contraseña.
 * Email incorrecto, contraseña incorrecta y usuario inactivo (RF-U4) dan el MISMO
 * error, para que nadie pueda averiguar qué emails existen (§11.3).
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
 * RF-U2 / §10.5: el usuario se busca en la base de datos en CADA pedido.
 * Si un admin lo desactiva, pierde el acceso al instante, aunque tenga una cookie válida.
 */
export async function buscarUsuarioDeSesion(userId: number | null): Promise<AuthUser | null> {
  if (userId === null) return null;
  const user = await db.query.usuarios.findFirst({
    where: and(eq(usuarios.id, userId), eq(usuarios.activo, true)),
  });
  return user ? toAuthUser(user) : null;
}

/** RF-U5: cada usuario cambia su propia contraseña, confirmando la actual. */
export async function cambiarContrasena(user: AuthUser, input: unknown): Promise<void> {
  const { actual, nueva } = parseInput(changePasswordSchema, input);
  const row = await db.query.usuarios.findFirst({ where: eq(usuarios.id, user.id) });
  if (!row || !(await bcrypt.compare(actual, row.passwordHash))) {
    throw new ApiError(422, "CONTRASENA_ACTUAL_INCORRECTA", "La contraseña actual no es correcta.", [
      { campo: "actual", mensaje: "La contraseña actual no es correcta." },
    ]);
  }
  await db
    .update(usuarios)
    .set({ passwordHash: await hashearContrasena(nueva) })
    .where(eq(usuarios.id, user.id));
}
