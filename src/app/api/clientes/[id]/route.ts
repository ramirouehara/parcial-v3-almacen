// GET /api/clientes/{id} (RF-C3) y PATCH /api/clientes/{id} (RF-C2, RF-C7). Ambos roles.
import { route } from "@/lib/api";
import { getCustomer, updateCustomer } from "@/services/customers";

export const GET = route<{ id: string }>(async ({ user, params }) => getCustomer(user, params.id));

export const PATCH = route<{ id: string }>(async ({ user, params, body }) => updateCustomer(user, params.id, await body()));
