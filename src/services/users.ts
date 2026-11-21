/**
 * Servicio de usuarios (RF-U4, RF-U5). Solo para admin.
 * Cada función sigue el orden del §10.2: validar, comprobar el permiso,
 * aplicar las reglas y devolver la forma pública (nunca el hash de la contraseña).
 */
import { randomBytes } from "node:crypto";
import { and, asc, eq, like, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { usuarios, type Usuario } from "@/db/schema";
import { ApiError, notFound } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import { idParam, type Paginated } from "@/schemas/common";
import { createUserSchema, listUsersSchema, updateUserSchema } from "@/schemas/users";
import { hashPassword } from "./auth";
import { requireAdmin, type AuthUser } from "./permissions";

/** Lo que devuelve la API de un usuario: todo, menos el hash de la contraseña. */
export type PublicUser = Omit<Usuario, "passwordHash" | "creadoEn"> & { creadoEn: string };

const toPublicUser = (u: Usuario): PublicUser => ({
  id: u.id,
  nombre: u.nombre,
  email: u.email,
  rol: u.rol,
  activo: u.activo,
  creadoEn: u.creadoEn.toISOString(),
});

const duplicatedEmail = () =>
  new ApiError(409, "EMAIL_DUPLICADO", "Ya existe un usuario con ese email.", [
    { campo: "email", mensaje: "Ya existe un usuario con ese email." },
  ]);

async function findUser(id: number): Promise<Usuario> {
  const user = await db.query.usuarios.findFirst({ where: eq(usuarios.id, id) });
  if (!user) throw notFound("El usuario");
  return user;
}

/** GET /api/usuarios: busca por nombre o email, filtra por activo, con páginas. */
export async function listUsers(user: AuthUser, query: unknown): Promise<Paginated<PublicUser>> {
  const { q, activo, page, pageSize } = parseInput(listUsersSchema, query);
  requireAdmin(user);

  const filters: SQL[] = [];
  if (q) filters.push(or(like(usuarios.nombre, `%${q}%`), like(usuarios.email, `%${q}%`))!);
  if (activo !== undefined) filters.push(eq(usuarios.activo, activo));
  const where = and(...filters);

  const rows = await db
    .select()
    .from(usuarios)
    .where(where)
    .orderBy(asc(usuarios.nombre))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const total = await db.$count(usuarios, where);

  return { data: rows.map(toPublicUser), page, pageSize, total };
}

/**
 * Crea la fila del usuario (email único, contraseña hasheada).
 * Acá NO se comprueba el permiso: lo hace createUser(), y el seed usa esta
 * función directo para crear el PRIMER admin (RF-U3), cuando todavía no hay ninguno.
 */
export async function insertUser(input: unknown): Promise<PublicUser> {
  const data = parseInput(createUserSchema, input);
  const existing = await db.query.usuarios.findFirst({ where: eq(usuarios.email, data.email) });
  if (existing) throw duplicatedEmail();

  const [created] = await db
    .insert(usuarios)
    .values({
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      passwordHash: await hashPassword(data.password),
    })
    .returning();
  return toPublicUser(created);
}

/** POST /api/usuarios (RF-U4). */
export async function createUser(user: AuthUser, input: unknown): Promise<PublicUser> {
  parseInput(createUserSchema, input);
  requireAdmin(user);
  return insertUser(input);
}

/** PATCH /api/usuarios/{id} (RF-U4): editar, cambiar el rol, activar o desactivar. */
export async function updateUser(user: AuthUser, id: unknown, input: unknown): Promise<PublicUser> {
  const userId = parseInput(idParam, id);
  const changes = parseInput(updateUserSchema, input);
  requireAdmin(user);

  const target = await findUser(userId);

  // Un admin no se puede dejar afuera: no puede desactivarse ni quitarse el rol de admin.
  const isSelf = target.id === user.id;
  if (isSelf && (changes.activo === false || (changes.rol && changes.rol !== "admin"))) {
    throw new ApiError(
      422,
      "OPERACION_SOBRE_SI_MISMO",
      "No podés desactivarte ni quitarte el rol de administrador.",
    );
  }

  if (changes.email && changes.email !== target.email) {
    const existing = await db.query.usuarios.findFirst({ where: eq(usuarios.email, changes.email) });
    if (existing) throw duplicatedEmail();
  }

  const [updated] = await db.update(usuarios).set(changes).where(eq(usuarios.id, userId)).returning();
  return toPublicUser(updated);
}

/**
 * POST /api/usuarios/{id}/reset-password (RF-U5).
 * Genera una contraseña temporal y la devuelve UNA sola vez: solo se guarda su hash,
 * así nadie la puede volver a leer después.
 */
export async function resetPassword(user: AuthUser, id: unknown): Promise<{ passwordTemporal: string }> {
  const userId = parseInput(idParam, id);
  requireAdmin(user);
  await findUser(userId);

  const passwordTemporal = randomBytes(6).toString("base64url"); // 8 caracteres al azar
  await db
    .update(usuarios)
    .set({ passwordHash: await hashPassword(passwordTemporal) })
    .where(eq(usuarios.id, userId));
  return { passwordTemporal };
}
