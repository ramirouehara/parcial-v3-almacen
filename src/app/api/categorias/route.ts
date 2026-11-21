// GET /api/categorias (ambos roles) y POST /api/categorias (admin) — RF-P7.
import { route } from "@/lib/api";
import { crearCategoria, listarCategorias } from "@/servicios/categorias";

export const GET = route(async ({ user, query }) => listarCategorias(user, query));

export const POST = route(async ({ user, body }) => crearCategoria(user, await body()), { status: 201 });
