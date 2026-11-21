/**
 * Servicio de stock (RF-P4, RF-P5, RF-P6; reglas 1 y 2).
 *
 * moverStock() es la ÚNICA función que cambia la existencia de un producto (§10.2).
 * Ventas, anulaciones, ingresos y egresos la llaman; ninguna toca la existencia por su cuenta.
 */
import { and, desc, eq, gte, lt, sql, type SQL } from "drizzle-orm";
import { db, writeTransaction, type Tx } from "@/db/conexion";
import { facturas, movimientosStock, productos, usuarios } from "@/db/esquema";
import { ApiError, notFound } from "@/lib/errores";
import { addDays, formatInvoiceNumber, startOfDayAR } from "@/lib/formato";
import { parseInput } from "@/lib/validacion";
import { idParam, type Paginated } from "@/esquemas/comunes";
import { listMovementsSchema, stockMovementSchema } from "@/esquemas/productos";
import { exigirAdmin, type AuthUser } from "./permisos";

type MovementType = "venta" | "anulacion" | "ingreso" | "egreso";

export type StockMove = {
  productoId: number;
  tipo: MovementType;
  /** Con signo: positivo suma stock, negativo lo resta. */
  cantidad: number;
  motivo: string;
  observacion?: string | null;
  usuarioId: number;
  facturaId?: number | null;
};

/** Lo que devuelve la API de un movimiento (§11.4). */
export type PublicMovement = {
  id: number;
  producto: { id: number; codigo: string; descripcion: string };
  tipo: MovementType;
  cantidad: number;
  existenciaResultante: number;
  motivo: string;
  observacion: string | null;
  referencia: { facturaId: number; numero: string } | null;
  usuario: { id: number; nombre: string };
  fecha: string;
};

/**
 * Reglas 1 y 2: cambia la existencia y graba el movimiento, dentro de la transacción `tx`.
 *
 * El UPDATE lleva la condición `existencia + cantidad >= 0`: si dos ventas quieren la
 * última unidad al mismo tiempo, la base aplica una y a la otra no le actualiza ninguna
 * fila, así que responde 409 STOCK_INSUFICIENTE. Como corre dentro de la misma
 * transacción que el resto de la operación, si algo falla después se deshace todo.
 */
export async function moverStock(tx: Tx, move: StockMove): Promise<{ id: number; existenciaResultante: number }> {
  const [updated] = await tx
    .update(productos)
    .set({ existencia: sql`${productos.existencia} + ${move.cantidad}` })
    .where(and(eq(productos.id, move.productoId), sql`${productos.existencia} + ${move.cantidad} >= 0`))
    .returning({ existencia: productos.existencia, codigo: productos.codigo, descripcion: productos.descripcion });

  if (!updated) {
    const product = await tx.query.productos.findFirst({ where: eq(productos.id, move.productoId) });
    if (!product) throw notFound("El producto");
    throw new ApiError(409, "STOCK_INSUFICIENTE", `No hay stock suficiente de ${product.descripcion}.`, [
      { productoId: product.id, codigo: product.codigo, solicitado: -move.cantidad, disponible: product.existencia },
    ]);
  }

  const [movement] = await tx
    .insert(movimientosStock)
    .values({
      productoId: move.productoId,
      tipo: move.tipo,
      cantidad: move.cantidad,
      existenciaResultante: updated.existencia,
      motivo: move.motivo,
      observacion: move.observacion ?? null,
      usuarioId: move.usuarioId,
      facturaId: move.facturaId ?? null,
    })
    .returning({ id: movimientosStock.id });

  return { id: movement.id, existenciaResultante: updated.existencia };
}

/** POST /api/productos/{id}/movimientos (RF-P4, RF-P5). Solo admin. */
export async function registrarMovimiento(user: AuthUser, productId: unknown, input: unknown): Promise<PublicMovement> {
  const id = parseInput(idParam, productId);
  const data = parseInput(stockMovementSchema, input);
  exigirAdmin(user);

  const movementId = await writeTransaction(async (tx) => {
    const result = await moverStock(tx, {
      productoId: id,
      tipo: data.tipo,
      // El signo lo pone el servidor: el egreso resta.
      cantidad: data.tipo === "egreso" ? -data.cantidad : data.cantidad,
      motivo: data.motivo,
      observacion: data.observacion,
      usuarioId: user.id,
    });
    return result.id;
  });

  const [movement] = await selectMovements(eq(movimientosStock.id, movementId), 1, 0);
  return movement;
}

/** Consulta común de los dos listados: trae el producto, el usuario y la factura de cada movimiento. */
async function selectMovements(where: SQL | undefined, limit: number, offset: number): Promise<PublicMovement[]> {
  const rows = await db
    .select({
      m: movimientosStock,
      producto: { id: productos.id, codigo: productos.codigo, descripcion: productos.descripcion },
      usuario: { id: usuarios.id, nombre: usuarios.nombre },
      factura: { id: facturas.id, puntoVenta: facturas.puntoVenta, numero: facturas.numero },
    })
    .from(movimientosStock)
    .innerJoin(productos, eq(movimientosStock.productoId, productos.id))
    .innerJoin(usuarios, eq(movimientosStock.usuarioId, usuarios.id))
    .leftJoin(facturas, eq(movimientosStock.facturaId, facturas.id))
    .where(where)
    .orderBy(desc(movimientosStock.fecha), desc(movimientosStock.id))
    .limit(limit)
    .offset(offset);

  return rows.map(({ m, producto, usuario, factura }) => ({
    id: m.id,
    producto,
    tipo: m.tipo,
    cantidad: m.cantidad,
    existenciaResultante: m.existenciaResultante,
    motivo: m.motivo,
    observacion: m.observacion,
    referencia: factura ? { facturaId: factura.id, numero: formatInvoiceNumber(factura.puntoVenta, factura.numero) } : null,
    usuario,
    fecha: m.fecha.toISOString(),
  }));
}

/**
 * GET /api/movimientos-stock y GET /api/productos/{id}/movimientos (RF-P6).
 * Del más nuevo al más viejo. `desde` y `hasta` son días en hora de Argentina (§11.1).
 */
export async function listarMovimientos(user: AuthUser, query: unknown): Promise<Paginated<PublicMovement>> {
  const { productoId, tipo, desde, hasta, page, pageSize } = parseInput(listMovementsSchema, query);

  const filters: SQL[] = [];
  if (productoId) filters.push(eq(movimientosStock.productoId, productoId));
  if (tipo) filters.push(eq(movimientosStock.tipo, tipo));
  if (desde) filters.push(gte(movimientosStock.fecha, startOfDayAR(desde)));
  if (hasta) filters.push(lt(movimientosStock.fecha, startOfDayAR(addDays(hasta, 1))));
  const where = and(...filters);

  const data = await selectMovements(where, pageSize, (page - 1) * pageSize);
  const total = await db.$count(movimientosStock, where);
  return { data, page, pageSize, total };
}

/** GET /api/productos/{id}/movimientos: el historial de un producto. */
export async function listarMovimientosDeProducto(user: AuthUser, productId: unknown, query: unknown) {
  const id = parseInput(idParam, productId);
  const product = await db.query.productos.findFirst({ where: eq(productos.id, id) });
  if (!product) throw notFound("El producto");
  return listarMovimientos(user, { ...(query as object), productoId: String(id) });
}
