import { optionalText, pagination, queryBool, requiredText, z } from "./common";

/** Importe en centavos (regla 10): entero, nunca con coma flotante. */
export const cents = z
  .number({ error: "Ingresá un importe válido." })
  .int({ error: "Ingresá un importe válido." })
  .positive({ error: "Tiene que ser mayor que cero." });

/** Una cantidad de unidades: los productos son envasados, se venden por unidad entera. */
export const units = z
  .number({ error: "Ingresá una cantidad." })
  .int({ error: "Tiene que ser un número entero." })
  .min(0, { error: "No puede ser negativa." });

const categoryId = z.number({ error: "Elegí una categoría." }).int().positive({ error: "Elegí una categoría." });

/** POST /api/categorias y PATCH /api/categorias/{id} (RF-P7). */
export const createCategorySchema = z.object({ nombre: requiredText(60) });
export const updateCategorySchema = z.strictObject({
  nombre: requiredText(60).optional(),
  activa: z.boolean().optional(),
});
/** GET /api/categorias: por defecto solo las activas; `todas=true` trae también las inactivas. */
export const listCategoriesSchema = z.object({ todas: queryBool.optional() });

/** POST /api/productos (RF-P2). La existencia NO se carga a mano: entra como `stockInicial`. */
export const createProductSchema = z.object({
  codigo: requiredText(20).transform((value) => value.toUpperCase()),
  descripcion: requiredText(120),
  categoriaId: categoryId,
  precio: cents,
  stockMinimo: units,
  stockInicial: units.optional(),
});

/**
 * PATCH /api/productos/{id} (RF-P2, RF-P3).
 * strictObject: si llega `existencia`, responde 422 "Este campo no se acepta" (§11.4).
 */
export const updateProductSchema = z.strictObject({
  codigo: requiredText(20)
    .transform((value) => value.toUpperCase())
    .optional(),
  descripcion: requiredText(120).optional(),
  categoriaId: categoryId.optional(),
  precio: cents.optional(),
  stockMinimo: units.optional(),
  activo: z.boolean().optional(),
});

/** GET /api/productos (RF-P1). `activo`: "true" (por defecto), "false" o "todos" (solo admin). */
export const listProductsSchema = z.object({
  q: z.string().trim().optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  bajoMinimo: queryBool.optional(),
  activo: z.enum(["true", "false", "todos"]).default("true"),
  ...pagination,
});

export const ingresoMotivos = ["Reposición", "Stock inicial", "Devolución de cliente"] as const;
export const egresoMotivos = ["Rotura", "Vencimiento", "Ajuste de inventario", "Uso interno"] as const;

/**
 * POST /api/productos/{id}/movimientos (RF-P4, RF-P5).
 * La cantidad llega siempre positiva: el signo lo pone el servidor según el tipo.
 */
export const stockMovementSchema = z
  .object({
    tipo: z.enum(["ingreso", "egreso"], { error: "Elegí ingreso o egreso." }),
    cantidad: units.min(1, { error: "Tiene que ser mayor que cero." }),
    motivo: requiredText(40),
    observacion: optionalText(200),
  })
  .refine(
    (m) =>
      m.tipo === "ingreso"
        ? (ingresoMotivos as readonly string[]).includes(m.motivo)
        : (egresoMotivos as readonly string[]).includes(m.motivo),
    { path: ["motivo"], error: "Elegí un motivo de la lista." },
  );

/** GET /api/productos/{id}/movimientos y GET /api/movimientos-stock (RF-P6). */
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Usá el formato AAAA-MM-DD." });
export const listMovementsSchema = z.object({
  productoId: z.coerce.number().int().positive().optional(),
  tipo: z.enum(["venta", "anulacion", "ingreso", "egreso"]).optional(),
  desde: day.optional(),
  hasta: day.optional(),
  ...pagination,
});

export type CreateProductInput = z.input<typeof createProductSchema>;
export type StockMovementInput = z.input<typeof stockMovementSchema>;
