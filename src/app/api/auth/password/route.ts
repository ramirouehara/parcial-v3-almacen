// PUT /api/auth/password (RF-U5): 204; 422 CONTRASENA_ACTUAL_INCORRECTA.
import { route } from "@/lib/api";
import { cambiarContrasena } from "@/servicios/autenticacion";

export const PUT = route(async ({ user, body }) => cambiarContrasena(user, await body()));
