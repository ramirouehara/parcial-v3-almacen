// PATCH /api/usuarios/{id} (RF-U4): editar, cambiar el rol, desactivar. Solo admin.
import { route } from "@/lib/api";
import { updateUser } from "@/servicios/usuarios";

export const PATCH = route<{ id: string }>(async ({ user, params, body }) =>
  updateUser(user, params.id, await body()),
);
