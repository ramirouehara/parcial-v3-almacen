"use server";

/**
 * Server Actions de la sesión (RF-U1, RF-U5).
 * "use server" convierte cada función exportada en un endpoint que el
 * navegador puede llamar como una función común. Son adaptadores finos:
 * solo llaman a un servicio (§10.3).
 */
import { redirect } from "next/navigation";
import { action, publicAction } from "@/lib/accion";
import { endSession, startSession } from "@/lib/sesion";
import { cambiarContrasena, login } from "@/servicios/autenticacion";

export const ingresarAccion = publicAction(async (input: unknown) => {
  const user = await login(input);
  await startSession(user.id);
  return user;
});

export async function salirAccion(): Promise<void> {
  await endSession();
  redirect("/login");
}

export const cambiarContrasenaAccion = action((user, input: unknown) => cambiarContrasena(user, input));
