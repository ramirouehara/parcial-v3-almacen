// GET /api/clientes (RF-C1, RF-C6) y POST /api/clientes (RF-C2, RF-V2). Ambos roles.
import { route } from "@/lib/api";
import { crearCliente, listarClientes } from "@/servicios/clientes";

export const GET = route(async ({ user, query }) => listarClientes(user, query));

export const POST = route(async ({ user, body }) => crearCliente(user, await body()), { status: 201 });
