/**
 * Esquema de la base de datos: las 9 tablas del §7 ("Modelo de datos mínimo").
 *
 * Convenciones que usan todas las tablas:
 * - `id` es un entero autoincremental.
 * - La plata va en centavos ENTEROS, nunca con coma flotante (regla 10): 1250000 = $ 12.500,00.
 * - Las fechas se guardan como milisegundos desde 1970 (UTC). Drizzle las convierte en Date.
 * - Los registros con historial nunca se borran: tienen una marca `activo` (regla 12).
 *
 * Los nombres de las propiedades (a la izquierda) son los que usan el código y la API, en camelCase.
 * Los nombres de las columnas (los textos) son los que guarda SQLite, en snake_case.
 */
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Ayudantes chicos, para que todas las tablas declaren estas columnas igual.
const id = () => integer("id").primaryKey({ autoIncrement: true });
const createdAt = (name = "creado_en") =>
  integer(name, { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());
const active = (name = "activo") => integer(name, { mode: "boolean" }).notNull().default(true);

// ---------------------------------------------------------------- usuarios (RF-U)

export const usuarios = sqliteTable("usuarios", {
  id: id(),
  email: text("email").notNull().unique(),
  nombre: text("nombre").notNull(),
  // Nunca la contraseña en sí: solo su hash bcrypt.
  passwordHash: text("password_hash").notNull(),
  rol: text("rol", { enum: ["admin", "vendedor"] }).notNull(),
  activo: active(),
  creadoEn: createdAt(),
});

// ---------------------------------------------------------- catálogo (RF-P)

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
    // Precio final en centavos (con impuestos incluidos).
    precio: integer("precio").notNull(),
    // Stock guardado. SOLO cambia a través de moverStock(), que además escribe
    // la fila correspondiente en movimientos_stock (regla 2).
    existencia: integer("existencia").notNull().default(0),
    stockMinimo: integer("stock_minimo").notNull().default(0),
    activo: active(),
    creadoEn: createdAt(),
  },
  (t) => [
    // Última línea de defensa de la regla 1: el propio SQLite rechaza el stock negativo.
    check("existencia_no_negativa", sql`${t.existencia} >= 0`),
    index("productos_categoria_idx").on(t.categoriaId),
  ],
);

// Una fila por cada cambio de stock (regla 2): la suma de `cantidad` de un producto
// tiene que ser siempre igual a su `existencia`.
export const movimientosStock = sqliteTable(
  "movimientos_stock",
  {
    id: id(),
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id),
    tipo: text("tipo", { enum: ["venta", "anulacion", "ingreso", "egreso"] }).notNull(),
    // Con signo: positivo suma stock (ingreso, anulacion), negativo lo resta.
    cantidad: integer("cantidad").notNull(),
    existenciaResultante: integer("existencia_resultante").notNull(),
    motivo: text("motivo").notNull(),
    observacion: text("observacion"),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    // Solo para ventas y anulaciones: qué factura causó el movimiento.
    facturaId: integer("factura_id").references(() => facturas.id),
    // Cuándo ocurrió. También es la fecha de creación de la fila.
    fecha: createdAt("fecha"),
  },
  (t) => [index("movimientos_stock_producto_idx").on(t.productoId)],
);

// ------------------------------------------------- clientes (RF-C)

export const clientes = sqliteTable("clientes", {
  id: id(),
  tipoDoc: text("tipo_doc", { enum: ["DNI", "CUIT"] }).notNull(),
  // Solo dígitos ("28456123"), así "28.456.123" y "28456123" son el mismo
  // documento. Los puntos se agregan al mostrarlo en pantalla.
  nroDoc: text("nro_doc").notNull().unique(),
  nombre: text("nombre").notNull(),
  domicilio: text("domicilio"),
  telefono: text("telefono"),
  email: text("email"),
  // La "libreta": ¿este cliente puede comprar fiado?
  cuentaCorriente: integer("cuenta_corriente", { mode: "boolean" }).notNull().default(false),
  // Límite de crédito en centavos. null = sin límite.
  limiteCredito: integer("limite_credito"),
  activo: active(),
  creadoEn: createdAt(),
});

// El saldo NO se guarda: son los débitos menos los créditos de estas filas (regla 7).
export const movimientosCuenta = sqliteTable(
  "movimientos_cuenta",
  {
    id: id(),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    // debito = el cliente debe más (una venta); credito = debe menos (pago, anulación).
    tipo: text("tipo", { enum: ["debito", "credito"] }).notNull(),
    // Siempre positivo: el signo lo da `tipo`.
    importe: integer("importe").notNull(),
    descripcion: text("descripcion").notNull(),
    // De dónde viene el movimiento: de una factura O de un pago.
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
    // Número de recibo, con su propia numeración correlativa (regla 4).
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

// ------------------------------------------------------- ventas (RF-V)

export const facturas = sqliteTable(
  "facturas",
  {
    id: id(),
    // Se muestra como "0001-00000042": punto de venta + número correlativo (regla 4).
    puntoVenta: integer("punto_venta").notNull(),
    numero: integer("numero").notNull(),
    // null = "Consumidor final".
    clienteId: integer("cliente_id").references(() => clientes.id),
    // El vendedor que la emitió (regla 11).
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    total: integer("total").notNull(),
    formaPago: text("forma_pago", { enum: ["contado", "tarjeta", "cuenta_corriente"] }).notNull(),
    // Solo efectivo: cuánto entregó el cliente (el vuelto se calcula).
    montoRecibido: integer("monto_recibido"),
    // Solo tarjeta: tipo, marca y últimos 4 dígitos. NUNCA el número completo (regla 9).
    tarjetaTipo: text("tarjeta_tipo", { enum: ["debito", "credito"] }),
    tarjetaMarca: text("tarjeta_marca"),
    tarjetaUltimos4: text("tarjeta_ultimos4"),
    estado: text("estado", { enum: ["emitida", "anulada"] })
      .notNull()
      .default("emitida"),
    // Se completa solo cuando un admin la anula (RF-V9).
    motivoAnulacion: text("motivo_anulacion"),
    anuladaEn: integer("anulada_en", { mode: "timestamp_ms" }),
    anuladaPorId: integer("anulada_por_id").references(() => usuarios.id),
    fecha: createdAt("fecha"),
  },
  (t) => [
    // Dos facturas nunca pueden compartir el número.
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
    // Se copia del catálogo cuando se emite la factura (regla 3): cambiar
    // el producto después no cambia las facturas ya emitidas.
    codigo: text("codigo").notNull(),
    descripcion: text("descripcion").notNull(),
    precioUnitario: integer("precio_unitario").notNull(),
    cantidad: integer("cantidad").notNull(),
    subtotal: integer("subtotal").notNull(),
    creadoEn: createdAt(),
  },
  (t) => [index("factura_items_factura_idx").on(t.facturaId)],
);

// Tipos deducidos de las tablas, para usar en el resto del código.
export type Usuario = typeof usuarios.$inferSelect;
export type Rol = Usuario["rol"];
export type Producto = typeof productos.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type Factura = typeof facturas.$inferSelect;
