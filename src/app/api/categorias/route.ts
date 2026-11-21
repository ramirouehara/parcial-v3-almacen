// GET /api/categorias (ambos roles) y POST /api/categorias (admin) — RF-P7.
import { route } from "@/lib/api";
import { createCategory, listCategories } from "@/services/categories";

export const GET = route(async ({ user, query }) => listCategories(user, query));

export const POST = route(async ({ user, body }) => createCategory(user, await body()), { status: 201 });
