// POST /api/auth/login (RF-U1): la única ruta pública.
import { publicRoute } from "@/lib/api";
import { startSession } from "@/lib/session";
import { login } from "@/services/auth";

export const POST = publicRoute(async ({ body }) => {
  const user = await login(await body());
  await startSession(user.id); // Set-Cookie con la sesión firmada
  return user;
});
