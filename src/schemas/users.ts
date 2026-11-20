import { email, pagination, password, queryBool, requiredText, z } from "./common";

export const roles = ["admin", "vendedor"] as const;
export const rol = z.enum(roles, { error: "Elegí un rol." });

/** POST /api/usuarios (RF-U4): the password is a temporary one. */
export const createUserSchema = z.object({
  nombre: requiredText(80),
  email,
  rol,
  password,
});

/**
 * PATCH /api/usuarios/{id} (RF-U4): any of these fields.
 * strictObject rejects fields that are not listed (§10.4): for example,
 * the password cannot be changed through this route.
 */
export const updateUserSchema = z.strictObject({
  nombre: requiredText(80).optional(),
  email: email.optional(),
  rol: rol.optional(),
  activo: z.boolean().optional(),
});

/** GET /api/usuarios: `q` searches by name or email. */
export const listUsersSchema = z.object({
  q: z.string().trim().optional(),
  activo: queryBool.optional(),
  ...pagination,
});

export type CreateUserInput = z.input<typeof createUserSchema>;
export type UpdateUserInput = z.input<typeof updateUserSchema>;
