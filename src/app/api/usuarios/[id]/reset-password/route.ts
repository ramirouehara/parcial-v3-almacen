// POST /api/usuarios/{id}/reset-password (RF-U5): devuelve la contraseña temporal una sola vez.
import { route } from "@/lib/api";
import { resetPassword } from "@/servicios/usuarios";

export const POST = route<{ id: string }>(async ({ user, params }) => resetPassword(user, params.id));
