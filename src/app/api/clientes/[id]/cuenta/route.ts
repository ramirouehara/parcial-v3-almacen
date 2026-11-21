// GET /api/clientes/{id}/cuenta (RF-C4): movimientos con el saldo acumulado. Acepta desde y hasta.
import { route } from "@/lib/api";
import { obtenerCuentaCorriente } from "@/servicios/clientes";

export const GET = route<{ id: string }>(async ({ user, params, query }) => obtenerCuentaCorriente(user, params.id, query));
