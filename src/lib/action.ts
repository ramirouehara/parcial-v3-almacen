/**
 * Common wrapper for Server Actions (§10.3).
 *
 * Same job as the route wrapper (session + errors), but instead of throwing
 * it RETURNS the result, so the form can show each error next to its field:
 *   { ok: true, data }   or   { ok: false, error: { code, message, details } }
 */
import { revalidatePath } from "next/cache";
import type { AuthUser } from "@/services/permissions";
import { toApiError, unauthenticated, type ErrorBody } from "./errors";
import { getSessionUser } from "./session";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ErrorBody };

/** An action that requires a session (all of them except login). */
export function action<Args extends unknown[], T>(
  fn: (user: AuthUser, ...args: Args) => Promise<T>,
) {
  return async (...args: Args): Promise<ActionResult<T>> => {
    try {
      const user = await getSessionUser();
      if (!user) throw unauthenticated();
      const data = await fn(user, ...args);
      // The screens show live data: re-render them after a change.
      revalidatePath("/", "layout");
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: toApiError(err).toBody() };
    }
  };
}

/** The only public action: login (there is no session yet). */
export function publicAction<Args extends unknown[], T>(fn: (...args: Args) => Promise<T>) {
  return async (...args: Args): Promise<ActionResult<T>> => {
    try {
      return { ok: true, data: await fn(...args) };
    } catch (err) {
      return { ok: false, error: toApiError(err).toBody() };
    }
  };
}
