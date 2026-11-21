/**
 * Envoltorio común para TODOS los Route Handlers (§10.3).
 *
 * Hace una sola vez la parte repetitiva:
 *  1. exige la sesión (sin ella, 401 NO_AUTENTICADO),
 *  2. resuelve los parámetros de la ruta ({id}),
 *  3. lee el cuerpo JSON (400 JSON_INVALIDO si está roto),
 *  4. convierte cualquier error en la forma estándar del §11.1.
 *
 * Así cada ruta es solo "llamar al servicio y responder". Ejemplo:
 *   export const GET = route(({ user, query }) => listUsers(user, query));
 */
import type { NextRequest } from "next/server";
import type { AuthUser } from "@/services/permissions";
import { ApiError, toApiError, unauthenticated } from "./errors";
import { getSessionUser } from "./session";

type Context<P> = {
  user: AuthUser;
  params: P;
  /** La query string como objeto: ?q=ana&page=2 -> { q: "ana", page: "2" } */
  query: Record<string, string>;
  /** Lee el cuerpo JSON. */
  body: () => Promise<unknown>;
};

async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "JSON_INVALIDO", "El cuerpo del pedido no es JSON válido.");
  }
}

/** undefined -> 204 No Content; cualquier otra cosa -> JSON con el status indicado. */
function toResponse(result: unknown, status: number): Response {
  if (result === undefined) return new Response(null, { status: 204 });
  return Response.json(result, { status });
}

export function errorResponse(err: unknown): Response {
  const apiError = toApiError(err);
  return Response.json({ error: apiError.toBody() }, { status: apiError.status });
}

/** Una ruta que exige sesión. `status` es el código de éxito (201 al crear). */
export function route<P = Record<string, string>>(
  handler: (ctx: Context<P>) => Promise<unknown>,
  { status = 200 } = {},
) {
  return async (req: NextRequest, ctx: { params: Promise<P> }) => {
    try {
      const user = await getSessionUser();
      if (!user) throw unauthenticated();
      const params = await ctx.params;
      const result = await handler({
        user,
        params,
        query: Object.fromEntries(req.nextUrl.searchParams),
        body: () => readJson(req),
      });
      return toResponse(result, status);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** La única ruta pública: POST /api/auth/login. */
export function publicRoute(handler: (ctx: { body: () => Promise<unknown> }) => Promise<unknown>) {
  return async (req: NextRequest) => {
    try {
      return toResponse(await handler({ body: () => readJson(req) }), 200);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
