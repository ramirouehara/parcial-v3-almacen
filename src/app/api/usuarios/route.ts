// GET /api/usuarios and POST /api/usuarios (RF-U4). Admin only.
import { route } from "@/lib/api";
import { createUser, listUsers } from "@/services/users";

export const GET = route(async ({ user, query }) => listUsers(user, query));

export const POST = route(async ({ user, body }) => createUser(user, await body()), { status: 201 });
