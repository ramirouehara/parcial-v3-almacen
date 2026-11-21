// GET /api/clientes/{id} (RF-C3) y PATCH /api/clientes/{id} (RF-C2, RF-C7). Ambos roles.
import { route } from "@/lib/api";
import { obtenerCliente, actualizarCliente } from "@/servicios/clientes";

export const GET = route<{ id: string }>(async ({ user, params }) => obtenerCliente(user, params.id));

export const PATCH = route<{ id: string }>(async ({ user, params, body }) => actualizarCliente(user, params.id, await body()));
