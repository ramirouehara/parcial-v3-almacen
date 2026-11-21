// GET /api/usuarios y POST /api/usuarios (RF-U4). Solo admin.
import { route } from "@/lib/api";
import { crearUsuario, listarUsuarios } from "@/servicios/usuarios";

export const GET = route(async ({ user, query }) => listarUsuarios(user, query));

export const POST = route(async ({ user, body }) => crearUsuario(user, await body()), { status: 201 });
