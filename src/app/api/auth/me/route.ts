// GET /api/auth/me (RF-U2): the logged-in user; 401 without a session.
import { route } from "@/lib/api";

export const GET = route(async ({ user }) => user);
