// POST /api/auth/logout (RF-U1): 204 y se borra la cookie.
import { route } from "@/lib/api";
import { endSession } from "@/lib/session";

export const POST = route(async () => {
  await endSession();
});
