import type { z } from "zod";
import { ApiError, type FieldError } from "./errors";

/**
 * Convierte los errores de Zod en la lista `details` del §11.1:
 *   [{ campo: "email", mensaje: "Ingresá un email válido." }, ...]
 * Un esquema estricto informa los campos desconocidos (por ejemplo `existencia` en el
 * PATCH de un producto) como un solo error "unrecognized_keys": lo separamos por campo.
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
 * Paso 1 de toda función de servicio (§10.2): validar la entrada cruda con el
 * esquema Zod compartido. Si algo está mal, lanza 422 VALIDACION.
 */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ApiError(422, "VALIDACION", "Hay campos con errores.", zodToFieldErrors(result.error));
  }
  return result.data;
}
