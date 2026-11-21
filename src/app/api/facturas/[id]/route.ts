// GET /api/facturas/{id} (RF-V7): la factura completa, con la anulación si la tiene.
import { route } from "@/lib/api";
import { getInvoice } from "@/servicios/facturas";

export const GET = route<{ id: string }>(async ({ user, params }) => getInvoice(user, params.id));
