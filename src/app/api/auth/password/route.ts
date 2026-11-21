// PUT /api/auth/password (RF-U5): 204; 422 CONTRASENA_ACTUAL_INCORRECTA.
import { route } from "@/lib/api";
import { changePassword } from "@/servicios/autenticacion";

export const PUT = route(async ({ user, body }) => changePassword(user, await body()));
