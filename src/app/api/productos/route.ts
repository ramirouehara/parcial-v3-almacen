// GET /api/productos (ambos roles, RF-P1) y POST /api/productos (admin, RF-P2).
import { route } from "@/lib/api";
import { crearProducto, listarProductos } from "@/servicios/productos";

export const GET = route(async ({ user, query }) => listarProductos(user, query));

export const POST = route(async ({ user, body }) => crearProducto(user, await body()), { status: 201 });
