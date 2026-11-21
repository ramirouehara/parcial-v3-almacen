// PATCH /api/usuarios/{id} (RF-U4): editar, cambiar el rol, desactivar. Solo admin.
import { route } from "@/lib/api";
import { updateUser } from "@/services/users";

export const PATCH = route<{ id: string }>(async ({ user, params, body }) =>
  updateUser(user, params.id, await body()),
);
