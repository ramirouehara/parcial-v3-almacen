/**
 * Third barrier of §10.5: every service checks the role.
 * Hiding a button only helps visually; this check is what really decides,
 * so a vendedor calling an admin route directly gets 403.
 */
import { forbidden } from "@/lib/errors";
import type { Rol } from "@/db/schema";

/** The logged-in user, as the services receive it. */
export type AuthUser = { id: number; nombre: string; email: string; rol: Rol };

/** Throws 403 SIN_PERMISO unless the user is an admin (table of §3). */
export function requireAdmin(user: AuthUser): void {
  if (user.rol !== "admin") throw forbidden();
}
