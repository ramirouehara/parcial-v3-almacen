/**
 * Servicio de facturas (RF-V1 a RF-V9; reglas 1 a 6, 9 y 11).
 * Emitir y consultar: ambos roles. Anular: solo admin.
 *
 * Emitir una factura es UNA transacción (RF-V6): o se graban factura, renglones,
 * stock y cuenta corriente, o no se graba nada.
 */
import { and, desc, eq, gte, inArray, like, lt, or, sql, type SQL } from "drizzle-orm";
import { db, writeTransaction, type Tx } from "@/db/conexion";
import { clientes, facturaItems, facturas, movimientosCuenta, productos, usuarios } from "@/db/esquema";
import { ApiError, notFound } from "@/lib/errores";
import { addDays, formatInvoiceNumber, startOfDayAR } from "@/lib/formato";
import { PUNTO_VENTA } from "@/lib/comercio";
import { parseInput } from "@/lib/validacion";
import { idParam, type Paginated } from "@/esquemas/comunes";
import { cancelInvoiceSchema, createInvoiceSchema, listInvoicesSchema } from "@/esquemas/facturas";
import { saldoDe } from "./clientes";
import { exigirAdmin, type AuthUser } from "./permisos";
import { moverStock } from "./stock";

type FormaPago = "contado" | "tarjeta" | "cuenta_corriente";

/** La factura completa, como la devuelve la API (§11.6). */
export type PublicInvoice = {
  id: number;
  puntoVenta: number;
  numero: number;
  numeroFormateado: string;
  fecha: string;
  estado: "emitida" | "anulada";
  cliente: { id: number; nombre: string; tipoDoc: "DNI" | "CUIT"; nroDoc: string; domicilio: string | null } | null;
  vendedor: { id: number; nombre: string };
  items: { productoId: number; codigo: string; descripcion: string; cantidad: number; precioUnitario: number; subtotal: number }[];
  total: number;
  pago:
    | { forma: "contado"; montoRecibido: number; vuelto: number }
    | { forma: "tarjeta"; tarjeta: { tipo: "debito" | "credito"; marca: string; ultimos4: string } }
    | { forma: "cuenta_corriente" };
  saldoCliente?: number;
  anulacion?: { fecha: string; usuario: { id: number; nombre: string }; motivo: string };
};

/** Una fila del listado de facturas (sin renglones). */
export type InvoiceListItem = {
  id: number;
  numeroFormateado: string;
  fecha: string;
  cliente: { id: number; nombre: string } | null;
  vendedor: { id: number; nombre: string };
  total: number;
  formaPago: FormaPago;
  estado: "emitida" | "anulada";
};

/** El próximo número de factura del punto de venta. Dentro de `tx`, es el definitivo (regla 4). */
async function nextInvoiceNumber(executor: Tx | typeof db): Promise<number> {
  const [{ ultimo }] = await executor
    .select({ ultimo: sql<number>`coalesce(max(${facturas.numero}), 0)` })
    .from(facturas)
    .where(eq(facturas.puntoVenta, PUNTO_VENTA));
  return Number(ultimo) + 1;
}

/** GET /api/facturas/proximo-numero: solo informativo; el número real se asigna al confirmar. */
export async function verProximoNumero(): Promise<{ numeroFormateado: string }> {
  return { numeroFormateado: formatInvoiceNumber(PUNTO_VENTA, await nextInvoiceNumber(db)) };
}

/**
 * POST /api/facturas (RF-V1 a RF-V6). Los pasos del §11.6, en orden, dentro de UNA transacción.
 * Si cualquier paso lanza un error, la transacción se deshace entera: no queda nada a medias.
 */
export async function crearFactura(user: AuthUser, input: unknown): Promise<PublicInvoice> {
  const data = parseInput(createInvoiceSchema, input);

  const invoiceId = await writeTransaction(async (tx) => {
    // 1. Los productos existen y están activos.
    const ids = data.items.map((i) => i.productoId);
    const rows = await tx.select().from(productos).where(inArray(productos.id, ids));
    const byId = new Map(rows.map((p) => [p.id, p]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length > 0) throw notFound(`El producto ${missing.join(", ")}`);
    const inactive = rows.filter((p) => !p.activo);
    if (inactive.length > 0) {
      throw new ApiError(422, "PRODUCTO_INACTIVO", `${inactive[0].descripcion} está dado de baja y no se puede vender.`, [
        ...inactive.map((p) => ({ productoId: p.id, codigo: p.codigo })),
      ]);
    }

    // 2. El cliente está activo; para cuenta corriente, tiene que tenerla habilitada (regla 6).
    const customer = data.clienteId
      ? await tx.query.clientes.findFirst({ where: eq(clientes.id, data.clienteId) })
      : undefined;
    if (data.clienteId && (!customer || !customer.activo)) {
      throw new ApiError(422, "VALIDACION", "Hay campos con errores.", [
        { campo: "clienteId", mensaje: "El cliente no existe o está dado de baja." },
      ]);
    }
    if (data.pago.forma === "cuenta_corriente" && !customer?.cuentaCorriente) {
      throw new ApiError(
        422,
        "CUENTA_CORRIENTE_NO_HABILITADA",
        customer
          ? "El cliente no tiene cuenta corriente habilitada."
          : "Consumidor final no puede comprar en cuenta corriente: elegí un cliente registrado.",
      );
    }

    // 3. La existencia alcanza (regla 1). Se informan todos los productos que fallan.
    const short = data.items
      .map((i) => ({ i, p: byId.get(i.productoId)! }))
      .filter(({ i, p }) => p.existencia < i.cantidad)
      .map(({ i, p }) => ({ productoId: p.id, codigo: p.codigo, solicitado: i.cantidad, disponible: p.existencia }));
    if (short.length > 0) {
      throw new ApiError(409, "STOCK_INSUFICIENTE", "No hay stock suficiente para algunos productos.", short);
    }

    // 4. El precio sale del catálogo, nunca del cliente (§11.1), y queda congelado en la factura (regla 3).
    const lines = data.items.map((i) => {
      const p = byId.get(i.productoId)!;
      return { productoId: p.id, codigo: p.codigo, descripcion: p.descripcion, precioUnitario: p.precio, cantidad: i.cantidad, subtotal: p.precio * i.cantidad };
    });
    const total = lines.reduce((sum, l) => sum + l.subtotal, 0);

    // 5. Contado: el monto recibido cubre el total. Cuenta corriente: no se pasa del límite (regla 7).
    let montoRecibido: number | null = null;
    if (data.pago.forma === "contado") {
      montoRecibido = data.pago.montoRecibido ?? total;
      if (montoRecibido < total) {
        throw new ApiError(422, "MONTO_INSUFICIENTE", "El monto recibido no cubre el total.", [
          { campo: "pago.montoRecibido", mensaje: "No alcanza para pagar el total." },
        ]);
      }
    }
    if (data.pago.forma === "cuenta_corriente" && customer && customer.limiteCredito !== null) {
      const saldoActual = await saldoDe(customer.id, tx);
      if (saldoActual + total > customer.limiteCredito) {
        throw new ApiError(422, "LIMITE_CREDITO_EXCEDIDO", "La venta supera el límite de crédito del cliente.", {
          saldoActual,
          limite: customer.limiteCredito,
          excedente: saldoActual + total - customer.limiteCredito,
        });
      }
    }

    // 6. El número se asigna recién ahora, al confirmar (regla 4). Como estamos en una
    //    transacción de escritura, nadie más puede tomar el mismo número en el medio.
    const numero = await nextInvoiceNumber(tx);
    const numeroFormateado = formatInvoiceNumber(PUNTO_VENTA, numero);

    // 7. La factura y sus renglones, con descripción y precio copiados del catálogo.
    const tarjeta = data.pago.forma === "tarjeta" ? data.pago.tarjeta : null;
    const [invoice] = await tx
      .insert(facturas)
      .values({
        puntoVenta: PUNTO_VENTA,
        numero,
        clienteId: customer?.id ?? null,
        usuarioId: user.id,
        total,
        formaPago: data.pago.forma,
        montoRecibido,
        // Regla 9: de la tarjeta solo se guardan tipo, marca y últimos 4 dígitos.
        tarjetaTipo: tarjeta?.tipo ?? null,
        tarjetaMarca: tarjeta?.marca ?? null,
        tarjetaUltimos4: tarjeta?.ultimos4 ?? null,
      })
      .returning({ id: facturas.id });
    await tx.insert(facturaItems).values(lines.map((l) => ({ ...l, facturaId: invoice.id })));

    // 8. Descuenta el stock con moverStock(): si otra venta se llevó la última unidad
    //    en el medio, el UPDATE condicional falla con 409 y se deshace todo (regla 1).
    for (const l of lines) {
      await moverStock(tx, {
        productoId: l.productoId,
        tipo: "venta",
        cantidad: -l.cantidad,
        motivo: `Venta ${numeroFormateado}`,
        usuarioId: user.id,
        facturaId: invoice.id,
      });
    }

    // 9. Si es a cuenta corriente, el débito en la cuenta del cliente.
    if (data.pago.forma === "cuenta_corriente" && customer) {
      await tx.insert(movimientosCuenta).values({
        clienteId: customer.id,
        tipo: "debito",
        importe: total,
        descripcion: `Factura ${numeroFormateado}`,
        facturaId: invoice.id,
        usuarioId: user.id,
      });
    }
    return invoice.id;
  });

  return obtenerFactura(user, invoiceId);
}

/** GET /api/facturas/{id} (RF-V7): la factura completa, para el comprobante. */
export async function obtenerFactura(user: AuthUser, id: unknown): Promise<PublicInvoice> {
  const invoiceId = parseInput(idParam, id);
  const [row] = await db
    .select({ f: facturas, vendedor: { id: usuarios.id, nombre: usuarios.nombre } })
    .from(facturas)
    .innerJoin(usuarios, eq(facturas.usuarioId, usuarios.id))
    .where(eq(facturas.id, invoiceId));
  if (!row) throw notFound("La factura");
  const { f, vendedor } = row;

  const items = await db
    .select()
    .from(facturaItems)
    .where(eq(facturaItems.facturaId, invoiceId))
    .orderBy(facturaItems.id);
  const customer = f.clienteId ? await db.query.clientes.findFirst({ where: eq(clientes.id, f.clienteId) }) : undefined;

  const pago: PublicInvoice["pago"] =
    f.formaPago === "contado"
      ? { forma: "contado", montoRecibido: f.montoRecibido ?? f.total, vuelto: (f.montoRecibido ?? f.total) - f.total }
      : f.formaPago === "tarjeta"
        ? { forma: "tarjeta", tarjeta: { tipo: f.tarjetaTipo!, marca: f.tarjetaMarca!, ultimos4: f.tarjetaUltimos4! } }
        : { forma: "cuenta_corriente" };

  const invoice: PublicInvoice = {
    id: f.id,
    puntoVenta: f.puntoVenta,
    numero: f.numero,
    numeroFormateado: formatInvoiceNumber(f.puntoVenta, f.numero),
    fecha: f.fecha.toISOString(),
    estado: f.estado,
    cliente: customer
      ? { id: customer.id, nombre: customer.nombre, tipoDoc: customer.tipoDoc, nroDoc: customer.nroDoc, domicilio: customer.domicilio }
      : null,
    vendedor,
    items: items.map((i) => ({
      productoId: i.productoId,
      codigo: i.codigo,
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario,
      subtotal: i.subtotal,
    })),
    total: f.total,
    pago,
  };
  if (f.formaPago === "cuenta_corriente" && customer) invoice.saldoCliente = await saldoDe(customer.id);
  if (f.estado === "anulada" && f.anuladaPorId && f.anuladaEn) {
    const by = await db.query.usuarios.findFirst({ where: eq(usuarios.id, f.anuladaPorId) });
    invoice.anulacion = {
      fecha: f.anuladaEn.toISOString(),
      usuario: { id: f.anuladaPorId, nombre: by?.nombre ?? "" },
      motivo: f.motivoAnulacion ?? "",
    };
  }
  return invoice;
}

/**
 * GET /api/facturas (RF-V8): de la más nueva a la más vieja, sin renglones.
 * `q` busca por número ("1233" o "0001-00001233") o por nombre del cliente.
 * `totalEmitido` suma solo las emitidas (no las anuladas) que cumplen el filtro.
 */
export async function listarFacturas(
  user: AuthUser,
  query: unknown,
): Promise<Paginated<InvoiceListItem> & { totalEmitido: number }> {
  const { q, desde, hasta, clienteId, vendedorId, forma, estado, page, pageSize } = parseInput(listInvoicesSchema, query);

  const filters: SQL[] = [];
  if (q) {
    const numberPart = q.includes("-") ? q.split("-").pop()! : q;
    const byName = like(clientes.nombre, `%${q}%`);
    filters.push(/^\d+$/.test(numberPart) ? or(eq(facturas.numero, Number(numberPart)), byName)! : byName);
  }
  if (desde) filters.push(gte(facturas.fecha, startOfDayAR(desde)));
  if (hasta) filters.push(lt(facturas.fecha, startOfDayAR(addDays(hasta, 1))));
  if (clienteId) filters.push(eq(facturas.clienteId, clienteId));
  if (vendedorId) filters.push(eq(facturas.usuarioId, vendedorId));
  if (forma) filters.push(eq(facturas.formaPago, forma));
  if (estado) filters.push(eq(facturas.estado, estado));
  const where = and(...filters);

  const rows = await db
    .select({
      f: facturas,
      cliente: { id: clientes.id, nombre: clientes.nombre },
      vendedor: { id: usuarios.id, nombre: usuarios.nombre },
    })
    .from(facturas)
    .leftJoin(clientes, eq(facturas.clienteId, clientes.id))
    .innerJoin(usuarios, eq(facturas.usuarioId, usuarios.id))
    .where(where)
    .orderBy(desc(facturas.fecha), desc(facturas.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ total, totalEmitido }] = await db
    .select({
      total: sql<number>`count(*)`,
      totalEmitido: sql<number>`coalesce(sum(case when ${facturas.estado} = 'emitida' then ${facturas.total} else 0 end), 0)`,
    })
    .from(facturas)
    .leftJoin(clientes, eq(facturas.clienteId, clientes.id))
    .where(where);

  return {
    data: rows.map(({ f, cliente, vendedor }) => ({
      id: f.id,
      numeroFormateado: formatInvoiceNumber(f.puntoVenta, f.numero),
      fecha: f.fecha.toISOString(),
      cliente: cliente?.id ? cliente : null,
      vendedor,
      total: f.total,
      formaPago: f.formaPago,
      estado: f.estado,
    })),
    page,
    pageSize,
    total: Number(total),
    totalEmitido: Number(totalEmitido),
  };
}

/** Los vendedores que se pueden elegir en el filtro del listado (ambos roles). */
export async function listarVendedores(): Promise<{ id: number; nombre: string }[]> {
  return db.select({ id: usuarios.id, nombre: usuarios.nombre }).from(usuarios).orderBy(usuarios.nombre);
}

/**
 * POST /api/facturas/{id}/anulacion (RF-V9; regla 5). Solo admin, con motivo obligatorio.
 * En UNA transacción: marca la factura como anulada, reingresa el stock de cada renglón
 * con un movimiento de anulación y, si fue a cuenta corriente, acredita el total.
 * La factura nunca se borra: queda visible con estado "anulada".
 */
export async function anularFactura(user: AuthUser, id: unknown, input: unknown): Promise<PublicInvoice> {
  const invoiceId = parseInput(idParam, id);
  const { motivo } = parseInput(cancelInvoiceSchema, input);
  exigirAdmin(user);

  await writeTransaction(async (tx) => {
    const invoice = await tx.query.facturas.findFirst({ where: eq(facturas.id, invoiceId) });
    if (!invoice) throw notFound("La factura");
    if (invoice.estado === "anulada") throw new ApiError(409, "FACTURA_ANULADA", "La factura ya estaba anulada.");

    const numeroFormateado = formatInvoiceNumber(invoice.puntoVenta, invoice.numero);
    await tx
      .update(facturas)
      .set({ estado: "anulada", motivoAnulacion: motivo, anuladaEn: new Date(), anuladaPorId: user.id })
      .where(eq(facturas.id, invoiceId));

    const items = await tx.select().from(facturaItems).where(eq(facturaItems.facturaId, invoiceId));
    for (const item of items) {
      await moverStock(tx, {
        productoId: item.productoId,
        tipo: "anulacion",
        cantidad: item.cantidad,
        motivo: `Anulación ${numeroFormateado}`,
        observacion: motivo,
        usuarioId: user.id,
        facturaId: invoiceId,
      });
    }

    if (invoice.formaPago === "cuenta_corriente" && invoice.clienteId) {
      await tx.insert(movimientosCuenta).values({
        clienteId: invoice.clienteId,
        tipo: "credito",
        importe: invoice.total,
        descripcion: `Anulación factura ${numeroFormateado}`,
        facturaId: invoiceId,
        usuarioId: user.id,
      });
    }
  });

  return obtenerFactura(user, invoiceId);
}
