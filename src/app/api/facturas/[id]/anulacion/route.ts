// POST /api/facturas/{id}/anulacion (RF-V9): anula con motivo. Solo admin.
import { route } from "@/lib/api";
import { anularFactura } from "@/servicios/facturas";

export const POST = route<{ id: string }>(async ({ user, params, body }) => anularFactura(user, params.id, await body()));
