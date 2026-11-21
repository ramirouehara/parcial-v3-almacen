import { optionalText, pagination, queryBool, requiredText, z } from "./comunes";
import { cents } from "./productos";

export const tiposDoc = ["DNI", "CUIT"] as const;
export const mediosPago = ["efectivo", "transferencia", "tarjeta_debito"] as const;

/** Solo los dígitos: "28.456.123" y "20-28456123-4" se guardan sin puntos ni guiones. */
export const digitsOnly = (value: string) => value.replace(/\D/g, "");

/** El error del número de documento según su tipo, o null si está bien. */
export function documentError(tipoDoc: (typeof tiposDoc)[number], nroDoc: string): string | null {
  if (tipoDoc === "DNI" && !/^\d{7,8}$/.test(nroDoc)) return "El DNI tiene 7 u 8 dígitos.";
  if (tipoDoc === "CUIT" && !/^\d{11}$/.test(nroDoc)) return "El CUIT tiene 11 dígitos.";
  return null;
}

const tipoDoc = z.enum(tiposDoc, { error: "Elegí DNI o CUIT." });
const nroDoc = requiredText(20).transform(digitsOnly);
const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => value === "" || z.email().safeParse(value).success, { error: "Ingresá un email válido." })
  .nullish()
  .transform((value) => (value ? value : null));
/** Límite de crédito en centavos; null = sin límite (RF-C2). */
const limiteCredito = cents.nullable().optional();

const customerFields = {
  nombre: requiredText(120),
  domicilio: optionalText(160),
  telefono: optionalText(40),
  email: optionalEmail,
  cuentaCorriente: z.boolean().default(false),
  limiteCredito,
};

/** POST /api/clientes (RF-C2, RF-V2: la misma ruta del alta rápida en Nueva venta). */
export const createCustomerSchema = z
  .object({ tipoDoc, nroDoc, ...customerFields })
  .superRefine((c, ctx) => {
    const error = documentError(c.tipoDoc, c.nroDoc);
    if (error) ctx.addIssue({ code: "custom", path: ["nroDoc"], message: error });
  });

/**
 * PATCH /api/clientes/{id} (RF-C2, RF-C7): cualquier campo del alta, más `activo`.
 * strictObject: el saldo no se acepta como dato (§11.5), se calcula.
 */
export const updateCustomerSchema = z.strictObject({
  tipoDoc: tipoDoc.optional(),
  nroDoc: nroDoc.optional(),
  nombre: customerFields.nombre.optional(),
  domicilio: customerFields.domicilio.optional(), // .optional(): si no viene, no se toca (no se borra)
  telefono: customerFields.telefono.optional(),
  email: customerFields.email.optional(),
  cuentaCorriente: z.boolean().optional(),
  limiteCredito,
  activo: z.boolean().optional(),
});

/** GET /api/clientes (RF-C1, RF-C6). `q` busca por nombre o documento, sin importar puntos ni guiones. */
export const listCustomersSchema = z.object({
  q: z.string().trim().optional(),
  conDeuda: queryBool.optional(),
  orden: z.enum(["nombre", "saldo"]).default("nombre"),
  activo: z.enum(["true", "false", "todos"]).default("true"),
  ...pagination,
});

/** GET /api/clientes/{id}/cuenta (RF-C4). */
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Usá el formato AAAA-MM-DD." });
export const accountSchema = z.object({ desde: day.optional(), hasta: day.optional() });

/** POST /api/clientes/{id}/pagos (RF-C5). */
export const paymentSchema = z.object({
  importe: cents,
  medio: z.enum(mediosPago, { error: "Elegí el medio de pago." }),
  observacion: optionalText(200),
});

export type CreateCustomerInput = z.input<typeof createCustomerSchema>;
