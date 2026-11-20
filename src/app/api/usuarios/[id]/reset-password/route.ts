// POST /api/usuarios/{id}/reset-password (RF-U5): returns the temporary password once.
import { route } from "@/lib/api";
import { resetPassword } from "@/services/users";

export const POST = route<{ id: string }>(async ({ user, params }) => resetPassword(user, params.id));
