"use server";

/**
 * Server Actions de la sesión (RF-U1, RF-U5).
 * "use server" convierte cada función exportada en un endpoint que el
 * navegador puede llamar como una función común. Son adaptadores finos:
 * solo llaman a un servicio (§10.3).
 */
import { redirect } from "next/navigation";
import { action, publicAction } from "@/lib/action";
import { endSession, startSession } from "@/lib/session";
import { changePassword, login } from "@/services/auth";

export const loginAction = publicAction(async (input: unknown) => {
  const user = await login(input);
  await startSession(user.id);
  return user;
});

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/login");
}

export const changePasswordAction = action((user, input: unknown) => changePassword(user, input));
