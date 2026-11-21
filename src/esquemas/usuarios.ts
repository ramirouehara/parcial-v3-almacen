import { email, pagination, password, queryBool, requiredText, z } from "./comunes";

export const roles = ["admin", "vendedor"] as const;
export const rol = z.enum(roles, { error: "Elegí un rol." });

/** POST /api/usuarios (RF-U4): la contraseña es una temporal. */
export const createUserSchema = z.object({
  nombre: requiredText(80),
  email,
  rol,
  password,
});

/**
 * PATCH /api/usuarios/{id} (RF-U4): cualquiera de estos campos.
 * strictObject rechaza los campos que no están en la lista (§10.4): por ejemplo,
 * la contraseña no se puede cambiar por esta ruta.
 */
export const updateUserSchema = z.strictObject({
  nombre: requiredText(80).optional(),
  email: email.optional(),
  rol: rol.optional(),
  activo: z.boolean().optional(),
});

/** GET /api/usuarios: `q` busca por nombre o email. */
export const listUsersSchema = z.object({
  q: z.string().trim().optional(),
  activo: queryBool.optional(),
  ...pagination,
});

export type CreateUserInput = z.input<typeof createUserSchema>;
export type UpdateUserInput = z.input<typeof updateUserSchema>;
