// POST /api/auth/login (RF-U1): the only public route.
import { publicRoute } from "@/lib/api";
import { startSession } from "@/lib/session";
import { login } from "@/services/auth";

export const POST = publicRoute(async ({ body }) => {
  const user = await login(await body());
  await startSession(user.id); // Set-Cookie with the signed session
  return user;
});
