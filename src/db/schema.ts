/**
 * Database schema: the 9 tables of §7 ("Modelo de datos mínimo").
 *
 * Conventions used in every table:
 * - `id` is an auto-increment integer.
 * - Money is INTEGER cents, never floating point (rule 10): 1250000 = $ 12.500,00.
 * - Dates are stored as milliseconds since 1970 (UTC). Drizzle turns them into Date.
 * - Records with history are never deleted: they have an `activo` flag (rule 12).
 *
 * Property names (left) are what the code and the API use, in camelCase.
 * Column names (the strings) are what SQLite stores, in snake_case.
 */
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Small helpers so every table declares these columns the same way.
const id = () => integer("id").primaryKey({ autoIncrement: true });
const createdAt = (name = "creado_en") =>
  integer(name, { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());
const active = (name = "activo") => integer(name, { mode: "boolean" }).notNull().default(true);

// ---------------------------------------------------------------- users (RF-U)

export const usuarios = sqliteTable("usuarios", {
  id: id(),
  email: text("email").notNull().unique(),
  nombre: text("nombre").notNull(),
  // Never the password itself: only its bcrypt hash.
  passwordHash: text("password_hash").notNull(),
  rol: text("rol", { enum: ["admin", "vendedor"] }).notNull(),
  activo: active(),
  creadoEn: createdAt(),
});

// ---------------------------------------------------------- catalog (RF-P)

export const categorias = sqliteTable("categorias", {
  id: id(),
  nombre: text("nombre").notNull().unique(),
  activa: active("activa"),
  creadoEn: createdAt(),
});

export const productos = sqliteTable(
  "productos",
  {
    id: id(),
    codigo: text("codigo").notNull().unique(),
    descripcion: text("descripcion").notNull(),
    categoriaId: integer("categoria_id")
      .notNull()
      .references(() => categorias.id),
    // Final price in cents (taxes included).
    precio: integer("precio").notNull(),
    // Stored stock. It ONLY changes through moverStock(), which also writes
    // the matching row in movimientos_stock (rule 2).
    existencia: integer("existencia").notNull().default(0),
    stockMinimo: integer("stock_minimo").notNull().default(0),
    activo: active(),
    creadoEn: createdAt(),
  },
  (t) => [
    // Last line of defense for rule 1: SQLite itself rejects negative stock.
    check("existencia_no_negativa", sql`${t.existencia} >= 0`),
    index("productos_categoria_idx").on(t.categoriaId),
  ],
);

// One row per stock change (rule 2): the sum of `cantidad` for a product
// must always equal its `existencia`.
export const movimientosStock = sqliteTable(
  "movimientos_stock",
  {
    id: id(),
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id),
    tipo: text("tipo", { enum: ["venta", "anulacion", "ingreso", "egreso"] }).notNull(),
    // Signed: positive adds stock (ingreso, anulacion), negative removes it.
    cantidad: integer("cantidad").notNull(),
    existenciaResultante: integer("existencia_resultante").notNull(),
    motivo: text("motivo").notNull(),
    observacion: text("observacion"),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    // Only for sales and cancellations: which invoice caused the movement.
    facturaId: integer("factura_id").references(() => facturas.id),
    // When it happened. It is also the creation date of the row.
    fecha: createdAt("fecha"),
  },
  (t) => [index("movimientos_stock_producto_idx").on(t.productoId)],
);

// ------------------------------------------------- customers (RF-C)

export const clientes = sqliteTable("clientes", {
  id: id(),
  tipoDoc: text("tipo_doc", { enum: ["DNI", "CUIT"] }).notNull(),
  // Digits only ("28456123"), so "28.456.123" and "28456123" are the same
  // document. The dots are added when it is shown on screen.
  nroDoc: text("nro_doc").notNull().unique(),
  nombre: text("nombre").notNull(),
  domicilio: text("domicilio"),
  telefono: text("telefono"),
  email: text("email"),
  // The "libreta": can this customer buy on credit?
  cuentaCorriente: integer("cuenta_corriente", { mode: "boolean" }).notNull().default(false),
  // Credit limit in cents. null = no limit.
  limiteCredito: integer("limite_credito"),
  activo: active(),
  creadoEn: createdAt(),
});

// The balance is NOT stored: it is debits minus credits of these rows (rule 7).
export const movimientosCuenta = sqliteTable(
  "movimientos_cuenta",
  {
    id: id(),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    // debito = the customer owes more (a sale); credito = owes less (payment, cancellation).
    tipo: text("tipo", { enum: ["debito", "credito"] }).notNull(),
    // Always positive: the sign comes from `tipo`.
    importe: integer("importe").notNull(),
    descripcion: text("descripcion").notNull(),
    // Where the movement comes from: an invoice OR a payment.
    facturaId: integer("factura_id").references(() => facturas.id),
    pagoId: integer("pago_id").references(() => pagos.id),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    fecha: createdAt("fecha"),
  },
  (t) => [
    check("importe_positivo", sql`${t.importe} > 0`),
    index("movimientos_cuenta_cliente_idx").on(t.clienteId),
  ],
);

export const pagos = sqliteTable(
  "pagos",
  {
    id: id(),
    // Receipt number, with its own correlative numbering (rule 4).
    numeroRecibo: integer("numero_recibo").notNull().unique(),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    importe: integer("importe").notNull(),
    medio: text("medio", { enum: ["efectivo", "transferencia", "tarjeta_debito"] }).notNull(),
    observacion: text("observacion"),
    fecha: createdAt("fecha"),
  },
  (t) => [index("pagos_cliente_idx").on(t.clienteId)],
);

// ------------------------------------------------------- sales (RF-V)

export const facturas = sqliteTable(
  "facturas",
  {
    id: id(),
    // Shown as "0001-00000042": point of sale + correlative number (rule 4).
    puntoVenta: integer("punto_venta").notNull(),
    numero: integer("numero").notNull(),
    // null = "Consumidor final".
    clienteId: integer("cliente_id").references(() => clientes.id),
    // The seller who issued it (rule 11).
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    total: integer("total").notNull(),
    formaPago: text("forma_pago", { enum: ["contado", "tarjeta", "cuenta_corriente"] }).notNull(),
    // Cash only: how much the customer handed over (the change is calculated).
    montoRecibido: integer("monto_recibido"),
    // Card only: type, brand and last 4 digits. NEVER the full number (rule 9).
    tarjetaTipo: text("tarjeta_tipo", { enum: ["debito", "credito"] }),
    tarjetaMarca: text("tarjeta_marca"),
    tarjetaUltimos4: text("tarjeta_ultimos4"),
    estado: text("estado", { enum: ["emitida", "anulada"] })
      .notNull()
      .default("emitida"),
    // Filled only when an admin cancels it (RF-V9).
    motivoAnulacion: text("motivo_anulacion"),
    anuladaEn: integer("anulada_en", { mode: "timestamp_ms" }),
    anuladaPorId: integer("anulada_por_id").references(() => usuarios.id),
    fecha: createdAt("fecha"),
  },
  (t) => [
    // Two invoices can never share a number.
    uniqueIndex("facturas_numero_uq").on(t.puntoVenta, t.numero),
    index("facturas_fecha_idx").on(t.fecha),
    index("facturas_cliente_idx").on(t.clienteId),
  ],
);

export const facturaItems = sqliteTable(
  "factura_items",
  {
    id: id(),
    facturaId: integer("factura_id")
      .notNull()
      .references(() => facturas.id),
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id),
    // Copied from the catalog when the invoice is issued (rule 3): changing
    // the product later does not change invoices already issued.
    codigo: text("codigo").notNull(),
    descripcion: text("descripcion").notNull(),
    precioUnitario: integer("precio_unitario").notNull(),
    cantidad: integer("cantidad").notNull(),
    subtotal: integer("subtotal").notNull(),
    creadoEn: createdAt(),
  },
  (t) => [index("factura_items_factura_idx").on(t.facturaId)],
);

// Types inferred from the tables, to use in the rest of the code.
export type Usuario = typeof usuarios.$inferSelect;
export type Rol = Usuario["rol"];
export type Producto = typeof productos.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type Factura = typeof facturas.$inferSelect;
