import { pagination, requiredText, z } from "./comunes";
import { cents } from "./productos";

export const formasPago = ["contado", "tarjeta", "cuenta_corriente"] as const;
export const tarjetaTipos = ["debito", "credito"] as const;
export const tarjetaMarcas = ["Visa", "Mastercard", "American Express", "Cabal", "Naranja", "Maestro"] as const;

const id = z.number({ error: "Es obligatorio." }).int().positive();

/** Un renglón de la venta: solo producto y cantidad. El precio lo pone el servidor (§11.1). */
const item = z.strictObject({
  productoId: id,
  cantidad: z
    .number({ error: "Ingresá una cantidad." })
    .int({ error: "Tiene que ser un número entero." })
    .positive({ error: "Tiene que ser mayor que cero." }),
});

/**
 * La forma de pago (RF-V5). strictObject en todos los niveles: si llega el número
 * completo de la tarjeta (o cualquier otro campo), se rechaza con 422 (regla 9).
 */
const pago = z.discriminatedUnion(
  "forma",
  [
    z.strictObject({ forma: z.literal("contado"), montoRecibido: cents.optional() }),
    z.strictObject({
      forma: z.literal("tarjeta"),
      tarjeta: z.strictObject({
        tipo: z.enum(tarjetaTipos, { error: "Elegí débito o crédito." }),
        marca: requiredText(30),
        ultimos4: z.string({ error: "Es obligatorio." }).regex(/^\d{4}$/, { error: "Son exactamente 4 dígitos." }),
      }),
    }),
    z.strictObject({ forma: z.literal("cuenta_corriente") }),
  ],
  { error: "Elegí la forma de pago." },
);

/** POST /api/facturas (RF-V1 a RF-V6). Lleva comprador, productos y forma de pago; nunca precios ni totales. */
export const createInvoiceSchema = z.strictObject({
  clienteId: id.nullable(),
  items: z
    .array(item, { error: "Agregá al menos un producto." })
    .min(1, { error: "Agregá al menos un producto." })
    .refine((items) => new Set(items.map((i) => i.productoId)).size === items.length, {
      error: "Hay productos repetidos: sumá la cantidad en un solo renglón.",
    }),
  pago,
});

/** POST /api/facturas/{id}/anulacion (RF-V9): el motivo es obligatorio. */
export const cancelInvoiceSchema = z.strictObject({ motivo: requiredText(200) });

/** GET /api/facturas (RF-V8). */
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Usá el formato AAAA-MM-DD." });
export const listInvoicesSchema = z.object({
  q: z.string().trim().optional(),
  desde: day.optional(),
  hasta: day.optional(),
  clienteId: z.coerce.number().int().positive().optional(),
  vendedorId: z.coerce.number().int().positive().optional(),
  forma: z.enum(formasPago).optional(),
  estado: z.enum(["emitida", "anulada"]).optional(),
  ...pagination,
});

export type CreateInvoiceInput = z.input<typeof createInvoiceSchema>;
