// GET /api/clientes/{id}/cuenta (RF-C4): movimientos con el saldo acumulado. Acepta desde y hasta.
import { route } from "@/lib/api";
import { getAccount } from "@/services/customers";

export const GET = route<{ id: string }>(async ({ user, params, query }) => getAccount(user, params.id, query));
