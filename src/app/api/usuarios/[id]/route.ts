// PATCH /api/usuarios/{id} (RF-U4): edit, change role, deactivate. Admin only.
import { route } from "@/lib/api";
import { updateUser } from "@/services/users";

export const PATCH = route<{ id: string }>(async ({ user, params, body }) =>
  updateUser(user, params.id, await body()),
);
