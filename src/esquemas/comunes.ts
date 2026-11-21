/**
 * Piezas de Zod compartidas.
 *
 * Cada esquema de src/schemas se usa en DOS lugares (§10.4):
 *  - en los formularios, para mostrar el error al lado de cada campo antes de enviar;
 *  - en los servicios, para validar de nuevo en el servidor.
 * Una regla, un solo lugar.
 */
import { z } from "zod";

// Los mensajes por defecto de Zod en español, para todos los esquemas de la app.
z.config(z.locales.es());

export { z };

export const REQUIRED = "Es obligatorio.";

/** Texto obligatorio, sin espacios en las puntas. */
export const requiredText = (max = 120) =>
  z
    .string({ error: REQUIRED })
    .trim()
    .min(1, { error: REQUIRED })
    .max(max, { error: `Máximo ${max} caracteres.` });

/** Texto opcional: un texto vacío se guarda como null. */
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

/** El {id} de una ruta como /api/usuarios/{id}: llega como texto ("5"). */
export const idParam = z.coerce
  .number({ error: "Identificador inválido." })
  .int({ error: "Identificador inválido." })
  .positive({ error: "Identificador inválido." });

/** Booleanos de la query string: "true" / "false". */
export const queryBool = z.enum(["true", "false"]).transform((value) => value === "true");

/** Paginación del §11.1: page desde 1; pageSize 20 por defecto, 100 como máximo. */
export const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

/** Forma de todo listado con páginas (§11.1). */
export type Paginated<T> = { data: T[]; page: number; pageSize: number; total: number };
