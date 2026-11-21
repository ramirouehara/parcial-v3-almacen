// POST /api/facturas/{id}/anulacion (RF-V9): anula con motivo. Solo admin.
import { route } from "@/lib/api";
import { cancelInvoice } from "@/services/invoices";

export const POST = route<{ id: string }>(async ({ user, params, body }) => cancelInvoice(user, params.id, await body()));
