/**
 * Envoltorio común para las Server Actions (§10.3).
 *
 * Hace lo mismo que el envoltorio de rutas (sesión + errores), pero en vez de lanzar
 * el error lo DEVUELVE, para que el formulario muestre cada error al lado de su campo:
 *   { ok: true, data }   o   { ok: false, error: { code, message, details } }
 */
import { revalidatePath } from "next/cache";
import type { AuthUser } from "@/servicios/permisos";
import { toApiError, unauthenticated, type ErrorBody } from "./errores";
import { getSessionUser } from "./sesion";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ErrorBody };

/** Una acción que exige sesión (todas, salvo el login). */
export function action<Args extends unknown[], T>(
  fn: (user: AuthUser, ...args: Args) => Promise<T>,
) {
  return async (...args: Args): Promise<ActionResult<T>> => {
    try {
      const user = await getSessionUser();
      if (!user) throw unauthenticated();
      const data = await fn(user, ...args);
      // Las pantallas muestran datos en vivo: se vuelven a dibujar después de un cambio.
      revalidatePath("/", "layout");
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: toApiError(err).toBody() };
    }
  };
}

/** La única acción pública: el login (todavía no hay sesión). */
export function publicAction<Args extends unknown[], T>(fn: (...args: Args) => Promise<T>) {
  return async (...args: Args): Promise<ActionResult<T>> => {
    try {
      return { ok: true, data: await fn(...args) };
    } catch (err) {
      return { ok: false, error: toApiError(err).toBody() };
    }
  };
}
