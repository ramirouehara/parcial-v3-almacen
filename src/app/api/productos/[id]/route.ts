// GET /api/productos/{id} (ambos roles) y PATCH /api/productos/{id} (admin) — RF-P1, RF-P2, RF-P3.
import { route } from "@/lib/api";
import { obtenerProducto, actualizarProducto } from "@/servicios/productos";

export const GET = route<{ id: string }>(async ({ user, params }) => obtenerProducto(user, params.id));

export const PATCH = route<{ id: string }>(async ({ user, params, body }) => actualizarProducto(user, params.id, await body()));
