"use server";

/** Server Actions de usuarios (RF-U4, RF-U5). Los mismos servicios que /api/usuarios. */
import { action } from "@/lib/action";
import { createUser, resetPassword, updateUser } from "@/services/users";

export const createUserAction = action((user, input: unknown) => createUser(user, input));

export const updateUserAction = action((user, id: number, input: unknown) => updateUser(user, id, input));

export const resetPasswordAction = action((user, id: number) => resetPassword(user, id));
