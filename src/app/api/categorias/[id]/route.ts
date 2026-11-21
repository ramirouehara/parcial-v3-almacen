// PATCH /api/categorias/{id} (RF-P7): renombrar, activar o desactivar. Solo admin.
import { route } from "@/lib/api";
import { updateCategory } from "@/servicios/categorias";

export const PATCH = route<{ id: string }>(async ({ user, params, body }) => updateCategory(user, params.id, await body()));
