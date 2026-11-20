import type { z } from "zod";
import { ApiError, type FieldError } from "./errors";

/**
 * Converts Zod errors into the `details` list of §11.1:
 *   [{ campo: "email", mensaje: "Ingresá un email válido." }, ...]
 * A strict schema reports unknown fields (for example `existencia` in a
 * product PATCH) as one "unrecognized_keys" issue: we split it per field.
 */
export function zodToFieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.flatMap((issue) => {
    if (issue.code === "unrecognized_keys") {
      return issue.keys.map((key) => ({
        campo: [...issue.path, key].join("."),
        mensaje: "Este campo no se acepta.",
      }));
    }
    const campo = issue.path.length > 0 ? issue.path.join(".") : "general";
    return [{ campo, mensaje: issue.message }];
  });
}

/**
 * Step 1 of every service function (§10.2): validate the raw input with the
 * shared Zod schema. If something is wrong it throws 422 VALIDACION.
 */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ApiError(422, "VALIDACION", "Hay campos con errores.", zodToFieldErrors(result.error));
  }
  return result.data;
}
