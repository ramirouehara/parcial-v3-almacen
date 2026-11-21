// GET /api/clientes (RF-C1, RF-C6) y POST /api/clientes (RF-C2, RF-V2). Ambos roles.
import { route } from "@/lib/api";
import { createCustomer, listCustomers } from "@/servicios/clientes";

export const GET = route(async ({ user, query }) => listCustomers(user, query));

export const POST = route(async ({ user, body }) => createCustomer(user, await body()), { status: 201 });
