// PATCH /api/usuarios/{id} (RF-U4): editar, cambiar el rol, desactivar. Solo admin.
import { route } from "@/lib/api";
import { actualizarUsuario } from "@/servicios/usuarios";

export const PATCH = route<{ id: string }>(async ({ user, params, body }) =>
  actualizarUsuario(user, params.id, await body()),
);
