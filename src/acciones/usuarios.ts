"use server";

/** Server Actions de usuarios (RF-U4, RF-U5). Los mismos servicios que /api/usuarios. */
import { action } from "@/lib/accion";
import { crearUsuario, restablecerContrasena, actualizarUsuario } from "@/servicios/usuarios";

export const crearUsuarioAccion = action((user, input: unknown) => crearUsuario(user, input));

export const actualizarUsuarioAccion = action((user, id: number, input: unknown) => actualizarUsuario(user, id, input));

export const restablecerContrasenaAccion = action((user, id: number) => restablecerContrasena(user, id));
