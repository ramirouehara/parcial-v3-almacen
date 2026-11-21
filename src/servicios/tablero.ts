/**
 * Servicio del tablero de inicio (RF-T1 a RF-T3). Ambos roles.
 * Solo cuenta facturas EMITIDAS (las anuladas no son ventas). El día y el mes se
 * calculan en hora de Argentina (§11.7).
 */
import { and, desc, eq, gt, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/conexion";
import { clientes, facturaItems, facturas, productos } from "@/db/esquema";
import { addDays, startOfDayAR, todayAR } from "@/lib/formato";
import { saldoSql } from "./clientes";
import type { AuthUser } from "./permisos";

type FormaPago = "contado" | "tarjeta" | "cuenta_corriente";

export type Dashboard = {
  hoy: { cantidad: number; importe: number };
  mes: { cantidad: number; importe: number; ticketPromedio: number };
  cuentasCorrientes: { totalAdeudado: number; clientesConSaldo: number };
  bajoMinimo: { cantidad: number };
  ventasDiarias: { fecha: string; importe: number }[];
  porFormaDePago: { forma: FormaPago; importe: number }[];
  masVendidos: { productoId: number; codigo: string; descripcion: string; unidades: number; importe: number }[];
};

const emitida = eq(facturas.estado, "emitida");
const between = (from: Date, to: Date) => and(emitida, gte(facturas.fecha, from), lt(facturas.fecha, to));

/** Cantidad e importe de las facturas emitidas entre dos instantes. */
async function salesBetween(from: Date, to: Date) {
  const [row] = await db
    .select({ cantidad: sql<number>`count(*)`, importe: sql<number>`coalesce(sum(${facturas.total}), 0)` })
    .from(facturas)
    .where(between(from, to));
  return { cantidad: Number(row.cantidad), importe: Number(row.importe) };
}

/** GET /api/tablero (RF-T1 a RF-T3): todo lo que muestra la pantalla de inicio, en una sola respuesta. */
export async function obtenerTablero(user: AuthUser, now = new Date()): Promise<Dashboard> {
  const today = todayAR(now);
  const dayStart = startOfDayAR(today);
  const dayEnd = startOfDayAR(addDays(today, 1));
  const monthStart = startOfDayAR(`${today.slice(0, 7)}-01`);
  const firstDay = addDays(today, -29); // 30 días contando hoy

  // RF-T1: indicadores.
  const hoy = await salesBetween(dayStart, dayEnd);
  const mes = await salesBetween(monthStart, dayEnd);
  const [debt] = await db
    .select({ total: sql<number>`coalesce(sum(${saldoSql}), 0)`, clientes: sql<number>`count(*)` })
    .from(clientes)
    .where(gt(saldoSql, 0));
  const bajo = await db.$count(
    productos,
    and(eq(productos.activo, true), lt(productos.existencia, productos.stockMinimo)),
  );

  // RF-T2: ventas de cada día de los últimos 30, agrupadas por día de Argentina (UTC-3).
  const dayExpr = sql<string>`date(${facturas.fecha} / 1000 - 3 * 3600, 'unixepoch')`;
  const daily = await db
    .select({ dia: dayExpr, importe: sql<number>`sum(${facturas.total})` })
    .from(facturas)
    .where(between(startOfDayAR(firstDay), dayEnd))
    .groupBy(dayExpr);
  const byDay = new Map(daily.map((d) => [d.dia, Number(d.importe)]));
  // Siempre 30 elementos, con 0 en los días sin ventas, así el gráfico no tiene huecos.
  const ventasDiarias = Array.from({ length: 30 }, (_, i) => {
    const fecha = addDays(firstDay, i);
    return { fecha, importe: byDay.get(fecha) ?? 0 };
  });

  // RF-T2: ventas del mes por forma de pago (las tres, aunque alguna sea 0).
  const forms = await db
    .select({ forma: facturas.formaPago, importe: sql<number>`sum(${facturas.total})` })
    .from(facturas)
    .where(between(monthStart, dayEnd))
    .groupBy(facturas.formaPago);
  const byForm = new Map(forms.map((f) => [f.forma, Number(f.importe)]));
  const porFormaDePago = (["contado", "tarjeta", "cuenta_corriente"] as const).map((forma) => ({
    forma,
    importe: byForm.get(forma) ?? 0,
  }));

  // RF-T3: los 5 productos más vendidos del mes, por unidades.
  const unidades = sql<number>`sum(${facturaItems.cantidad})`;
  const top = await db
    .select({
      productoId: facturaItems.productoId,
      codigo: facturaItems.codigo,
      descripcion: facturaItems.descripcion,
      unidades,
      importe: sql<number>`sum(${facturaItems.subtotal})`,
    })
    .from(facturaItems)
    .innerJoin(facturas, eq(facturaItems.facturaId, facturas.id))
    .where(between(monthStart, dayEnd))
    .groupBy(facturaItems.productoId)
    .orderBy(desc(unidades))
    .limit(5);

  return {
    hoy,
    mes: { ...mes, ticketPromedio: mes.cantidad > 0 ? Math.round(mes.importe / mes.cantidad) : 0 },
    cuentasCorrientes: { totalAdeudado: Number(debt.total), clientesConSaldo: Number(debt.clientes) },
    bajoMinimo: { cantidad: bajo },
    ventasDiarias,
    porFormaDePago,
    masVendidos: top.map((t) => ({ ...t, unidades: Number(t.unidades), importe: Number(t.importe) })),
  };
}
