// GET /api/productos/{id}/movimientos (ambos roles, RF-P6) y POST (admin, RF-P4 y RF-P5).
import { route } from "@/lib/api";
import { listarMovimientosDeProducto, registrarMovimiento } from "@/servicios/stock";

export const GET = route<{ id: string }>(async ({ user, params, query }) => listarMovimientosDeProducto(user, params.id, query));

export const POST = route<{ id: string }>(async ({ user, params, body }) => registrarMovimiento(user, params.id, await body()), {
  status: 201,
});
