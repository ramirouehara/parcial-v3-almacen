import { email, password, REQUIRED, z } from "./common";

/** POST /api/auth/login (RF-U1). */
export const loginSchema = z.object({
  email,
  password: z.string({ error: REQUIRED }).min(1, { error: REQUIRED }),
});

/** PUT /api/auth/password (RF-U5): cada usuario cambia su propia contraseña. */
export const changePasswordSchema = z.object({
  actual: z.string({ error: REQUIRED }).min(1, { error: REQUIRED }),
  nueva: password,
});

export type LoginInput = z.input<typeof loginSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
