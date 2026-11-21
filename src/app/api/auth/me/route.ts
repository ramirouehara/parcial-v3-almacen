// GET /api/auth/me (RF-U2): el usuario logueado; 401 sin sesión.
import { route } from "@/lib/api";

export const GET = route(async ({ user }) => user);
