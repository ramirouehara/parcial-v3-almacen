"use server";

/**
 * Server Actions for the session (RF-U1, RF-U5).
 * "use server" turns each exported function into an endpoint that the
 * browser can call like a normal function. They are thin adapters:
 * they only call a service (§10.3).
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
