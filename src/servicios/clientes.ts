/**
 * Servicio de clientes y cuenta corriente (RF-C1 a RF-C4, RF-C6, RF-C7; regla 7).
 * Ambos roles pueden dar de alta y editar clientes (§3).
 *
 * El saldo NO se guarda en ningún lado: siempre son los débitos menos los créditos
 * de movimientos_cuenta (regla 7). Una sola fuente de verdad.
 */
import { and, asc, desc, eq, gt, gte, like, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { db, type Tx } from "@/db/conexion";
import { clientes, facturas, movimientosCuenta, type Cliente } from "@/db/esquema";
import { ApiError, notFound } from "@/lib/errores";
import { addDays, formatInvoiceNumber, startOfDayAR } from "@/lib/formato";
import { parseInput } from "@/lib/validacion";
import { idParam, type Paginated } from "@/esquemas/comunes";
import {
  accountSchema,
  createCustomerSchema,
  digitsOnly,
  documentError,
  listCustomersSchema,
  updateCustomerSchema,
} from "@/esquemas/clientes";
import type { AuthUser } from "./permisos";

/** Lo que devuelve la API de un cliente (§11.5). */
export type PublicCustomer = {
  id: number;
  tipoDoc: "DNI" | "CUIT";
  nroDoc: string;
  nombre: string;
  domicilio: string | null;
  telefono: string | null;
  email: string | null;
  cuentaCorriente: boolean;
  limiteCredito: number | null;
  saldo: number;
  /** Cuánto más le podemos fiar. null = sin límite. */
  disponible: number | null;
  activo: boolean;
};

/**
 * Regla 7 en SQL: débitos menos créditos del cliente de cada fila.
 * Se escribe con los nombres completos ("clientes"."id"): dentro de una subconsulta,
 * un "id" suelto se confundiría con el id del movimiento.
 */
export const balanceSql = sql<number>`coalesce((
  select sum(case when mc.tipo = 'debito' then mc.importe else -mc.importe end)
  from movimientos_cuenta mc where mc.cliente_id = "clientes"."id"
), 0)`;

/** El saldo de un cliente (regla 7). Recibe `tx` cuando se calcula dentro de una transacción. */
export async function balanceOf(clienteId: number, executor: Tx | typeof db = db): Promise<number> {
  const [row] = await executor
    .select({ saldo: balanceSql })
    .from(clientes)
    .where(eq(clientes.id, clienteId));
  return row ? Number(row.saldo) : 0;
}

const toPublicCustomer = (c: Cliente, saldo: number): PublicCustomer => ({
  id: c.id,
  tipoDoc: c.tipoDoc,
  nroDoc: c.nroDoc,
  nombre: c.nombre,
  domicilio: c.domicilio,
  telefono: c.telefono,
  email: c.email,
  cuentaCorriente: c.cuentaCorriente,
  limiteCredito: c.limiteCredito,
  saldo,
  disponible: c.limiteCredito === null ? null : c.limiteCredito - saldo,
  activo: c.activo,
});

const duplicatedDocument = () =>
  new ApiError(409, "DOCUMENTO_DUPLICADO", "Ya existe un cliente con ese documento.", [
    { campo: "nroDoc", mensaje: "Ya existe un cliente con ese documento." },
  ]);

async function findCustomer(id: number): Promise<Cliente> {
  const customer = await db.query.clientes.findFirst({ where: eq(clientes.id, id) });
  if (!customer) throw notFound("El cliente");
  return customer;
}

/**
 * GET /api/clientes (RF-C1, RF-C6): búsqueda por nombre o documento, con el saldo de cada uno.
 * `conDeuda=true` deja solo los que deben y suma `totalAdeudado` (la pantalla de saldos).
 */
export async function listCustomers(
  user: AuthUser,
  query: unknown,
): Promise<Paginated<PublicCustomer> & { totalAdeudado?: number }> {
  const { q, conDeuda, orden, activo, page, pageSize } = parseInput(listCustomersSchema, query);

  const filters: SQL[] = [];
  if (q) {
    const digits = digitsOnly(q);
    const byName = like(clientes.nombre, `%${q}%`);
    filters.push(digits ? or(byName, like(clientes.nroDoc, `%${digits}%`))! : byName);
  }
  if (activo !== "todos") filters.push(eq(clientes.activo, activo === "true"));
  if (conDeuda) filters.push(gt(balanceSql, 0));
  const where = and(...filters);

  const rows = await db
    .select({ c: clientes, saldo: balanceSql })
    .from(clientes)
    .where(where)
    .orderBy(orden === "saldo" ? desc(balanceSql) : asc(clientes.nombre))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [{ total, totalAdeudado }] = await db
    .select({ total: sql<number>`count(*)`, totalAdeudado: sql<number>`coalesce(sum(${balanceSql}), 0)` })
    .from(clientes)
    .where(where);

  const result = {
    data: rows.map((r) => toPublicCustomer(r.c, Number(r.saldo))),
    page,
    pageSize,
    total: Number(total),
  };
  return conDeuda ? { ...result, totalAdeudado: Number(totalAdeudado) } : result;
}

export type InvoiceSummary = {
  id: number;
  numero: string;
  fecha: string;
  total: number;
  formaPago: "contado" | "tarjeta" | "cuenta_corriente";
  estado: "emitida" | "anulada";
};

/** GET /api/clientes/{id} (RF-C3): datos, saldo y las 6 últimas facturas. */
export async function getCustomer(
  user: AuthUser,
  id: unknown,
): Promise<PublicCustomer & { ultimasFacturas: InvoiceSummary[] }> {
  const customerId = parseInput(idParam, id);
  const customer = await findCustomer(customerId);
  const invoices = await db
    .select()
    .from(facturas)
    .where(eq(facturas.clienteId, customerId))
    .orderBy(desc(facturas.fecha), desc(facturas.id))
    .limit(6);

  return {
    ...toPublicCustomer(customer, await balanceOf(customerId)),
    ultimasFacturas: invoices.map((f) => ({
      id: f.id,
      numero: formatInvoiceNumber(f.puntoVenta, f.numero),
      fecha: f.fecha.toISOString(),
      total: f.total,
      formaPago: f.formaPago,
      estado: f.estado,
    })),
  };
}

/** POST /api/clientes (RF-C2). Ambos roles. Sin cuenta corriente no hay límite de crédito. */
export async function createCustomer(user: AuthUser, input: unknown): Promise<PublicCustomer> {
  const data = parseInput(createCustomerSchema, input);

  const existing = await db.query.clientes.findFirst({ where: eq(clientes.nroDoc, data.nroDoc) });
  if (existing) throw duplicatedDocument();

  const [created] = await db
    .insert(clientes)
    .values({ ...data, limiteCredito: data.cuentaCorriente ? (data.limiteCredito ?? null) : null })
    .returning();
  return toPublicCustomer(created, 0);
}

/**
 * PATCH /api/clientes/{id} (RF-C2, RF-C7). Ambos roles.
 * No se puede dar de baja ni quitarle la cuenta corriente a un cliente con saldo:
 * 422 SALDO_PENDIENTE (primero tiene que pagar).
 */
export async function updateCustomer(user: AuthUser, id: unknown, input: unknown): Promise<PublicCustomer> {
  const customerId = parseInput(idParam, id);
  const changes = parseInput(updateCustomerSchema, input);
  const customer = await findCustomer(customerId);

  // El documento se valida contra su tipo, aunque llegue solo uno de los dos.
  if (changes.tipoDoc || changes.nroDoc) {
    const error = documentError(changes.tipoDoc ?? customer.tipoDoc, changes.nroDoc ?? customer.nroDoc);
    if (error) throw new ApiError(422, "VALIDACION", "Hay campos con errores.", [{ campo: "nroDoc", mensaje: error }]);
  }
  if (changes.nroDoc) {
    const existing = await db.query.clientes.findFirst({
      where: and(eq(clientes.nroDoc, changes.nroDoc), ne(clientes.id, customerId)),
    });
    if (existing) throw duplicatedDocument();
  }

  const saldo = await balanceOf(customerId);
  if (saldo !== 0 && (changes.activo === false || changes.cuentaCorriente === false)) {
    throw new ApiError(
      422,
      "SALDO_PENDIENTE",
      "El cliente tiene saldo pendiente: primero tiene que cancelarlo.",
    );
  }

  const cuentaCorriente = changes.cuentaCorriente ?? customer.cuentaCorriente;
  const [updated] = await db
    .update(clientes)
    .set({ ...changes, ...(cuentaCorriente ? {} : { limiteCredito: null }) })
    .where(eq(clientes.id, customerId))
    .returning();
  return toPublicCustomer(updated, saldo);
}

export type AccountMovement = {
  id: number;
  fecha: string;
  tipo: "debito" | "credito";
  importe: number;
  descripcion: string;
  facturaId: number | null;
  pagoId: number | null;
  /** Saldo acumulado después de este movimiento (RF-C4). */
  saldo: number;
};

/**
 * GET /api/clientes/{id}/cuenta (RF-C4): movimientos en orden cronológico con el saldo
 * acumulado en cada renglón. Si `desde` corta el historial, `saldoAnterior` trae lo de antes.
 */
export async function getAccount(user: AuthUser, id: unknown, query: unknown) {
  const customerId = parseInput(idParam, id);
  const { desde, hasta } = parseInput(accountSchema, query);
  const customer = await findCustomer(customerId);

  const signed = sql<number>`case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end`;
  const ofCustomer = eq(movimientosCuenta.clienteId, customerId);

  let saldoAnterior = 0;
  const filters: SQL[] = [ofCustomer];
  if (desde) {
    const from = startOfDayAR(desde);
    const [row] = await db
      .select({ s: sql<number>`coalesce(sum(${signed}), 0)` })
      .from(movimientosCuenta)
      .where(and(ofCustomer, lt(movimientosCuenta.fecha, from)));
    saldoAnterior = Number(row.s);
    filters.push(gte(movimientosCuenta.fecha, from));
  }
  if (hasta) filters.push(lt(movimientosCuenta.fecha, startOfDayAR(addDays(hasta, 1))));

  const rows = await db
    .select()
    .from(movimientosCuenta)
    .where(and(...filters))
    .orderBy(asc(movimientosCuenta.fecha), asc(movimientosCuenta.id));

  let saldo = saldoAnterior;
  const movimientos: AccountMovement[] = rows.map((m) => {
    saldo += m.tipo === "debito" ? m.importe : -m.importe;
    return {
      id: m.id,
      fecha: m.fecha.toISOString(),
      tipo: m.tipo,
      importe: m.importe,
      descripcion: m.descripcion,
      facturaId: m.facturaId,
      pagoId: m.pagoId,
      saldo,
    };
  });

  return { cliente: { id: customer.id, nombre: customer.nombre }, saldoAnterior, movimientos, saldo };
}
