// POST /api/clientes/{id}/pagos (RF-C5): registra el pago y devuelve el recibo. Ambos roles.
import { route } from "@/lib/api";
import { registerPayment } from "@/services/payments";

export const POST = route<{ id: string }>(async ({ user, params, body }) => registerPayment(user, params.id, await body()), {
  status: 201,
});
