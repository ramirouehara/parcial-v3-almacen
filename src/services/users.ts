/**
 * Users service (RF-U4, RF-U5). Admin only.
 * Every function follows the order of §10.2: validate, check permission,
 * apply the rules, return the public shape (never the password hash).
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

/** What the API returns for a user: everything except the password hash. */
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

/** GET /api/usuarios: search by name or email, filter by active, paginated. */
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
 * Creates the user row (unique email, hashed password).
 * No permission check here: createUser() does it, and the seed uses this
 * directly to create the FIRST admin (RF-U3), when there is no admin yet.
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

/** PATCH /api/usuarios/{id} (RF-U4): edit, change role, activate or deactivate. */
export async function updateUser(user: AuthUser, id: unknown, input: unknown): Promise<PublicUser> {
  const userId = parseInput(idParam, id);
  const changes = parseInput(updateUserSchema, input);
  requireAdmin(user);

  const target = await findUser(userId);

  // An admin cannot lock themselves out: no self-deactivation, no losing the admin role.
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
 * Generates a temporary password and returns it ONCE: only its hash is stored,
 * so nobody can read it again later.
 */
export async function resetPassword(user: AuthUser, id: unknown): Promise<{ passwordTemporal: string }> {
  const userId = parseInput(idParam, id);
  requireAdmin(user);
  await findUser(userId);

  const passwordTemporal = randomBytes(6).toString("base64url"); // 8 random characters
  await db
    .update(usuarios)
    .set({ passwordHash: await hashPassword(passwordTemporal) })
    .where(eq(usuarios.id, userId));
  return { passwordTemporal };
}
