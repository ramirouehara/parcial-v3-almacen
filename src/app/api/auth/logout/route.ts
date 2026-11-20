// POST /api/auth/logout (RF-U1): 204 and the cookie is deleted.
import { route } from "@/lib/api";
import { endSession } from "@/lib/session";

export const POST = route(async () => {
  await endSession();
});
