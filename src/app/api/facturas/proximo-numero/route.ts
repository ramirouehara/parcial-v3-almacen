// GET /api/facturas/proximo-numero (RF-V1): solo informativo; el número real se asigna al confirmar.
// Este segmento fijo tiene prioridad sobre [id] (§11.9).
import { route } from "@/lib/api";
import { previewNextNumber } from "@/services/invoices";

export const GET = route(async () => previewNextNumber());
