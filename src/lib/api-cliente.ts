/**
 * Llamadas a la API REST desde el navegador (§10.6: la búsqueda en vivo y la
 * confirmación de la venta consumen la API). Devuelve el mismo formato que las
 * Server Actions, así los componentes manejan los errores igual en los dos casos.
 */
import type { ActionResult } from "./accion";

export async function apiFetch<T>(url: string, init?: { method?: string; body?: unknown }): Promise<ActionResult<T>> {
  try {
    const response = await fetch(url, {
      method: init?.method ?? "GET",
      headers: init?.body !== undefined ? { "content-type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const json = response.status === 204 ? undefined : await response.json();
    if (!response.ok) return { ok: false, error: json.error };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: { code: "ERROR_INTERNO", message: "No se pudo conectar con el servidor." } };
  }
}
