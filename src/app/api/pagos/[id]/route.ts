// GET /api/pagos/{id} (RF-C5): el recibo, para reimprimirlo.
import { route } from "@/lib/api";
import { obtenerPago } from "@/servicios/pagos";

export const GET = route<{ id: string }>(async ({ user, params }) => obtenerPago(user, params.id));
