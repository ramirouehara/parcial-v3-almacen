/**
 * Shared Zod building blocks.
 *
 * Every schema in src/schemas is used in TWO places (§10.4):
 *  - by the forms, to show errors next to each field before sending;
 *  - by the services, to validate again on the server.
 * One rule, one place.
 */
import { z } from "zod";

// Zod's default messages in Spanish, for every schema of the app.
z.config(z.locales.es());

export { z };

export const REQUIRED = "Es obligatorio.";

/** Required text, without spaces at the ends. */
export const requiredText = (max = 120) =>
  z
    .string({ error: REQUIRED })
    .trim()
    .min(1, { error: REQUIRED })
    .max(max, { error: `Máximo ${max} caracteres.` });

/** Optional text: an empty string is saved as null. */
export const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max, { error: `Máximo ${max} caracteres.` })
    .nullish()
    .transform((value) => (value ? value : null));

export const email = z
  .string({ error: REQUIRED })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Ingresá un email válido." }));

export const password = z
  .string({ error: REQUIRED })
  .min(8, { error: "Tiene que tener al menos 8 caracteres." })
  .max(72, { error: "Máximo 72 caracteres." });

/** The {id} of a route like /api/usuarios/{id}: it arrives as text ("5"). */
export const idParam = z.coerce
  .number({ error: "Identificador inválido." })
  .int({ error: "Identificador inválido." })
  .positive({ error: "Identificador inválido." });

/** Query string booleans: "true" / "false". */
export const queryBool = z.enum(["true", "false"]).transform((value) => value === "true");

/** Pagination of §11.1: page from 1; pageSize 20 by default, 100 at most. */
export const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

/** Shape of every paginated list (§11.1). */
export type Paginated<T> = { data: T[]; page: number; pageSize: number; total: number };
