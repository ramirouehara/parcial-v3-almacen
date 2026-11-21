/**
 * Tercera barrera del §10.5: cada servicio comprueba el rol.
 * Ocultar un botón solo ayuda a la vista; este control es el que decide de verdad,
 * así un vendedor que llama directo a una ruta de admin recibe 403.
 */
import { forbidden } from "@/lib/errores";
import type { Rol } from "@/db/esquema";

/** El usuario logueado, tal como lo reciben los servicios. */
export type AuthUser = { id: number; nombre: string; email: string; rol: Rol };

/** Lanza 403 SIN_PERMISO salvo que el usuario sea admin (tabla del §3). */
export function exigirAdmin(user: AuthUser): void {
  if (user.rol !== "admin") throw forbidden();
}
