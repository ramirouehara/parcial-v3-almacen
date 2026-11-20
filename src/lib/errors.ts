/**
 * The ONE error class that services throw (§10.4).
 * The adapters (route handlers and server actions) turn it into the
 * standard error shape of §11.1:
 *   { "error": { "code": "...", "message": "...", "details": ... } }
 */

// Every code of the table in §11.8.
export type ErrorCode =
  | "JSON_INVALIDO"
  | "NO_AUTENTICADO"
  | "CREDENCIALES_INVALIDAS"
  | "SIN_PERMISO"
  | "NO_ENCONTRADO"
  | "CODIGO_DUPLICADO"
  | "DOCUMENTO_DUPLICADO"
  | "EMAIL_DUPLICADO"
  | "NOMBRE_DUPLICADO"
  | "CATEGORIA_EN_USO"
  | "STOCK_INSUFICIENTE"
  | "FACTURA_ANULADA"
  | "VALIDACION"
  | "PRODUCTO_INACTIVO"
  | "CUENTA_CORRIENTE_NO_HABILITADA"
  | "LIMITE_CREDITO_EXCEDIDO"
  | "MONTO_INSUFICIENTE"
  | "PAGO_SUPERA_DEUDA"
  | "SALDO_PENDIENTE"
  | "CONTRASENA_ACTUAL_INCORRECTA"
  | "OPERACION_SOBRE_SI_MISMO"
  | "ERROR_INTERNO";

/** One field error inside `details` (e.g. { campo: "email", mensaje: "Es obligatorio." }). */
export type FieldError = { campo: string; mensaje: string };

export type ErrorBody = { code: ErrorCode; message: string; details?: unknown };

export class ApiError extends Error {
  constructor(
    public readonly status: number, // HTTP status: 401, 403, 404, 409, 422...
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }

  toBody(): ErrorBody {
    const body: ErrorBody = { code: this.code, message: this.message };
    if (this.details !== undefined) body.details = this.details;
    return body;
  }
}

// Shortcuts for the errors that every module uses.
export const notFound = (what = "El recurso") =>
  new ApiError(404, "NO_ENCONTRADO", `${what} no existe.`);

export const forbidden = () =>
  new ApiError(403, "SIN_PERMISO", "No tenés permiso para realizar esta operación.");

export const unauthenticated = () =>
  new ApiError(401, "NO_AUTENTICADO", "Tenés que iniciar sesión.");

/**
 * Turns anything that was thrown into an ApiError.
 * An unexpected error is logged on the server and the client only gets a
 * generic message, never the details (§10.4).
 */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  console.error("[unexpected error]", err);
  return new ApiError(500, "ERROR_INTERNO", "Ocurrió un error inesperado. Intentá de nuevo.");
}
