/**
 * Common wrapper for EVERY Route Handler (§10.3).
 *
 * It does the repetitive part once:
 *  1. requires the session (401 NO_AUTENTICADO without it),
 *  2. resolves the route params ({id}),
 *  3. reads the JSON body (400 JSON_INVALIDO if it is broken),
 *  4. turns any error into the standard shape of §11.1.
 *
 * So each route is just "call the service and respond". Example:
 *   export const GET = route(({ user, query }) => listUsers(user, query));
 */
import type { NextRequest } from "next/server";
import type { AuthUser } from "@/services/permissions";
import { ApiError, toApiError, unauthenticated } from "./errors";
import { getSessionUser } from "./session";

type Context<P> = {
  user: AuthUser;
  params: P;
  /** The query string as an object: ?q=ana&page=2 -> { q: "ana", page: "2" } */
  query: Record<string, string>;
  /** Reads the JSON body. */
  body: () => Promise<unknown>;
};

async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "JSON_INVALIDO", "El cuerpo del pedido no es JSON válido.");
  }
}

/** undefined -> 204 No Content; anything else -> JSON with the given status. */
function toResponse(result: unknown, status: number): Response {
  if (result === undefined) return new Response(null, { status: 204 });
  return Response.json(result, { status });
}

export function errorResponse(err: unknown): Response {
  const apiError = toApiError(err);
  return Response.json({ error: apiError.toBody() }, { status: apiError.status });
}

/** A route that requires a session. `status` is the success code (201 for creations). */
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

/** The only public route: POST /api/auth/login. */
export function publicRoute(handler: (ctx: { body: () => Promise<unknown> }) => Promise<unknown>) {
  return async (req: NextRequest) => {
    try {
      return toResponse(await handler({ body: () => readJson(req) }), 200);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
