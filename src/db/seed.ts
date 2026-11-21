/**
 * Script de datos iniciales: `pnpm run db:seed`.
 *
 * Arranca de una base vacía y carga los datos A TRAVÉS DE LOS SERVICIOS, los mismos
 * que usa la app (§10.7). Así el stock, los saldos y la numeración cumplen todas las
 * reglas, y el script sirve además como prueba de los servicios.
 *
 * Carga (§8 Datos de prueba): 2 usuarios, 5 categorías, 30 productos, 10 clientes,
 * 50 facturas repartidas en los últimos 30 días, algunos pagos y 2 anulaciones.
 *
 * Los servicios graban la fecha de "ahora". Para repartir las ventas en 30 días, después
 * de crear cada factura o pago se le corrige la fecha (y la de sus movimientos). Eso no
 * cambia ninguna cantidad ni importe: solo cuándo figura que pasó.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "./client";
import * as t from "./schema";
import { addDays, startOfDayAR, todayAR } from "@/lib/format";
import { createCategory } from "@/services/categories";
import { balanceOf, createCustomer } from "@/services/customers";
import { cancelInvoice, createInvoice } from "@/services/invoices";
import { registerPayment } from "@/services/payments";
import type { AuthUser } from "@/services/permissions";
import { createProduct } from "@/services/products";
import { createUser, insertUser } from "@/services/users";

// Usuarios de prueba, uno por rol (el README los lista para la defensa).
export const TEST_USERS = {
  admin: { nombre: "Lucía Quispe", email: "admin@reydani.test", password: "admin1234" },
  vendedor: { nombre: "Martín Flores", email: "vendedor@reydani.test", password: "vendedor1234" },
};

/** Borra todas las filas, primero las hijas, así ninguna clave foránea queda apuntando a la nada. */
async function clearDatabase() {
  await db.delete(t.movimientosCuenta);
  await db.delete(t.movimientosStock);
  await db.delete(t.facturaItems);
  await db.delete(t.pagos);
  await db.delete(t.facturas);
  await db.delete(t.clientes);
  await db.delete(t.productos);
  await db.delete(t.categorias);
  await db.delete(t.usuarios);
  // Reinicia los contadores autoincrementales, así los ids vuelven a empezar en 1.
  await db.run(sql`DELETE FROM sqlite_sequence`);
}

/** Números "al azar" pero siempre los mismos: cada vez que se corre el seed sale igual. */
function randomGenerator(seed: number) {
  let state = seed;
  const next = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  return {
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T,>(items: readonly T[]) => items[Math.floor(next() * items.length)],
    chance: (p: number) => next() < p,
  };
}

const CATEGORIES = ["Almacén", "Bebidas", "Lácteos y fiambres", "Limpieza", "Perfumería"];

// [código, descripción, categoría (índice), precio en pesos, stock mínimo, stock inicial]
const PRODUCTS: [string, string, number, number, number, number][] = [
  ["AL-001", "Yerba mate Playadito 1 kg", 0, 4850, 6, 40],
  ["AL-002", "Azúcar Ledesma 1 kg", 0, 1290, 8, 50],
  ["AL-003", "Fideos tirabuzón Matarazzo 500 g", 0, 1450, 8, 45],
  ["AL-004", "Arroz largo fino Gallo 1 kg", 0, 1980, 6, 35],
  ["AL-005", "Aceite de girasol Natura 900 ml", 0, 2750, 6, 30],
  ["AL-006", "Harina 000 Pureza 1 kg", 0, 1100, 6, 40],
  ["AL-007", "Galletitas Criollitas 3 x 100 g", 0, 1650, 5, 30],
  ["AL-008", "Dulce de leche La Serenísima 400 g", 0, 2390, 4, 20],
  ["AL-009", "Tomate triturado Arcor 520 g", 0, 990, 6, 4],
  ["AL-010", "Café La Virginia 250 g", 0, 4200, 3, 15],
  ["BE-001", "Gaseosa Coca-Cola 2,25 L", 1, 3200, 10, 60],
  ["BE-002", "Agua Villavicencio 2 L", 1, 1350, 10, 50],
  ["BE-003", "Cerveza Quilmes lata 473 ml", 1, 1600, 12, 70],
  ["BE-004", "Jugo Cepita naranja 1 L", 1, 1890, 6, 30],
  ["BE-005", "Vino Toro tinto 1 L", 1, 2100, 6, 3],
  ["BE-006", "Fernet Branca 750 ml", 1, 11900, 3, 12],
  ["LA-001", "Leche La Serenísima entera 1 L", 2, 1490, 10, 50],
  ["LA-002", "Yogur bebible Ser frutilla 1 L", 2, 2290, 5, 20],
  ["LA-003", "Queso cremoso Sancor 500 g", 2, 5600, 3, 12],
  ["LA-004", "Manteca La Serenísima 200 g", 2, 2450, 4, 18],
  ["LA-005", "Salchichas Paty x 6", 2, 2900, 4, 2],
  ["LI-001", "Lavandina Ayudín 1 L", 3, 1150, 6, 30],
  ["LI-002", "Detergente Magistral 500 ml", 3, 2350, 5, 25],
  ["LI-003", "Jabón en polvo Ala 800 g", 3, 4900, 3, 12],
  ["LI-004", "Esponja Mortimer x 2", 3, 890, 5, 20],
  ["LI-005", "Papel higiénico Higienol x 4", 3, 2600, 6, 30],
  ["PE-001", "Jabón de tocador Dove 90 g", 4, 1750, 6, 25],
  ["PE-002", "Shampoo Sedal 340 ml", 4, 4100, 3, 12],
  ["PE-003", "Pasta dental Colgate 90 g", 4, 2200, 5, 20],
  ["PE-004", "Desodorante Rexona 150 ml", 4, 3900, 3, 1],
];

// [tipo, número, nombre, domicilio, teléfono, cuenta corriente, límite en pesos (null = sin límite)]
const CUSTOMERS: ["DNI" | "CUIT", string, string, string, string, boolean, number | null][] = [
  ["DNI", "28456123", "Mariana López", "Las Heras 455", "381 455-2210", true, 30000],
  ["DNI", "31298774", "Carlos Gómez", "San Martín 1020", "381 520-8833", true, 30000],
  ["DNI", "35987654", "Rosa Mamani", "Lamadrid 210", "381 611-4021", true, 25000],
  ["DNI", "26745190", "Jorge Fernández", "Junín 870", "381 498-7712", true, null],
  ["CUIT", "20301112223", "Kiosco Don Tito", "Av. Mate de Luna 3150", "381 433-9090", true, 50000],
  ["DNI", "40123456", "Valentina Ruiz", "Crisóstomo Álvarez 640", "381 655-1288", false, null],
  ["DNI", "33876501", "Diego Herrera", "Maipú 1345", "381 590-3341", false, null],
  ["DNI", "29654782", "Ana Paz", "Córdoba 455", "381 477-6620", true, 30000],
  ["CUIT", "27258963414", "Silvia Romero", "Santiago 980", "381 422-5153", false, null],
  ["DNI", "38912345", "Lucas Medina", "Chacabuco 77", "381 671-0044", false, null],
];

/** Un instante del día `day` ("AAAA-MM-DD") a la hora indicada, en hora de Argentina. */
const at = (day: string, hour: number, minute: number) =>
  new Date(startOfDayAR(day).getTime() + (hour * 60 + minute) * 60_000);

/** Corrige la fecha de una factura y de los movimientos que generó. */
async function backdateInvoice(invoiceId: number, date: Date) {
  await db.update(t.facturas).set({ fecha: date }).where(eq(t.facturas.id, invoiceId));
  await db.update(t.movimientosStock).set({ fecha: date }).where(eq(t.movimientosStock.facturaId, invoiceId));
  await db.update(t.movimientosCuenta).set({ fecha: date }).where(eq(t.movimientosCuenta.facturaId, invoiceId));
}

async function main() {
  console.log("Vaciando la base...");
  await clearDatabase();
  const random = randomGenerator(2026);
  const now = new Date();
  const today = todayAR(now);
  const firstDay = addDays(today, -29);

  // RF-U3: todavía no hay admin, así que el primero se crea directo.
  const admin: AuthUser = await insertUser({ ...TEST_USERS.admin, rol: "admin" });
  // De acá en adelante, todo pasa por los servicios normales, actuando como ese admin.
  const vendedor: AuthUser = await createUser(admin, { ...TEST_USERS.vendedor, rol: "vendedor" });

  console.log("Cargando categorías y productos...");
  const categories = [];
  for (const nombre of CATEGORIES) categories.push(await createCategory(admin, { nombre }));
  const products = [];
  for (const [codigo, descripcion, cat, pesos, stockMinimo, stockInicial] of PRODUCTS) {
    products.push(
      await createProduct(admin, {
        codigo,
        descripcion,
        categoriaId: categories[cat].id,
        precio: pesos * 100,
        stockMinimo,
        stockInicial,
      }),
    );
  }
  // El stock inicial queda fechado el día antes de la primera venta.
  await db.update(t.movimientosStock).set({ fecha: at(addDays(firstDay, -1), 8, 0) });

  console.log("Cargando clientes...");
  const customers = [];
  for (const [tipoDoc, nroDoc, nombre, domicilio, telefono, cuentaCorriente, limite] of CUSTOMERS) {
    customers.push(
      await createCustomer(vendedor, {
        tipoDoc,
        nroDoc,
        nombre,
        domicilio,
        telefono,
        cuentaCorriente,
        limiteCredito: limite === null ? null : limite * 100,
      }),
    );
  }
  const accountCustomers = customers.filter((c) => c.cuentaCorriente);

  console.log("Emitiendo 50 facturas en los últimos 30 días...");
  const invoices: { id: number; forma: string }[] = [];
  const sellable = products.filter((p) => p.existencia >= 6); // los de poco stock quedan "para reponer"
  // Lo que va quedando de cada producto, para no pedir más de lo que hay.
  const stock = new Map(sellable.map((p) => [p.id, p.existencia]));
  for (let n = 0; n < 50; n++) {
    // Las fechas avanzan con el número: la numeración queda en orden cronológico.
    // Las últimas 3 caen hoy, para que el tablero muestre ventas del día.
    const day = addDays(firstDay, Math.min(29, Math.floor((n * 31) / 50)));
    let date = at(day, 9 + (n % 10), random.int(0, 59));
    // Nunca una fecha en el futuro: las de hoy quedan un rato antes de "ahora".
    if (date > now) date = new Date(now.getTime() - (50 - n) * 7 * 60_000);

    const chosen = new Map<number, number>();
    for (let i = random.int(1, 4); i > 0; i--) {
      const product = random.pick(sellable);
      const left = stock.get(product.id)! - (chosen.get(product.id) ?? 0);
      if (left > 2) chosen.set(product.id, Math.min(random.int(1, 3), left - 2));
    }
    if (chosen.size === 0) chosen.set(sellable[0].id, 1);
    const items = [...chosen].map(([productoId, cantidad]) => ({ productoId, cantidad }));

    const roll = n % 10;
    const forma = roll < 5 ? "contado" : roll < 8 ? "tarjeta" : "cuenta_corriente";
    const cliente =
      forma === "cuenta_corriente" ? random.pick(accountCustomers) : random.chance(0.3) ? random.pick(customers) : null;
    const pago =
      forma === "tarjeta"
        ? {
            forma,
            tarjeta: {
              tipo: random.pick(["debito", "credito"] as const),
              marca: random.pick(["Visa", "Mastercard", "Cabal", "Naranja"]),
              ultimos4: String(random.int(1000, 9999)),
            },
          }
        : { forma };

    const seller = n % 2 === 0 ? vendedor : admin;
    let invoice;
    try {
      invoice = await createInvoice(seller, { clienteId: cliente?.id ?? null, items, pago });
    } catch (err) {
      // Si una venta a cuenta supera el límite (regla 7), se cobra de contado, como en el mostrador.
      if ((err as { code?: string }).code !== "LIMITE_CREDITO_EXCEDIDO") throw err;
      invoice = await createInvoice(seller, { clienteId: cliente?.id ?? null, items, pago: { forma: "contado" } });
    }
    await backdateInvoice(invoice.id, date);
    invoices.push({ id: invoice.id, forma: invoice.pago.forma });
    for (const item of items) stock.set(item.productoId, stock.get(item.productoId)! - item.cantidad);
  }

  console.log("Registrando anulaciones y pagos...");
  // Dos anulaciones (RF-V9), una de contado y una a cuenta corriente, para que se vean en el listado.
  // Van ANTES de los pagos: así el crédito de la anulación nunca deja saldo a favor (regla 8).
  const toCancel = [invoices.find((i) => i.forma === "contado"), invoices.find((i) => i.forma === "cuenta_corriente")];
  for (const invoice of toCancel) {
    if (invoice) await cancelInvoice(admin, invoice.id, { motivo: "Error en la carga de cantidades" });
  }

  for (const [index, customer] of accountCustomers.slice(0, 4).entries()) {
    const debt = await balanceOf(customer.id);
    if (debt <= 0) continue;
    // Un pago parcial redondo: la mitad de la deuda, en pesos enteros.
    const importe = Math.max(100, Math.floor(debt / 2 / 100) * 100);
    const receipt = await registerPayment(vendedor, customer.id, {
      importe,
      medio: random.pick(["efectivo", "transferencia", "tarjeta_debito"] as const),
    });
    const date = at(addDays(today, -3 + index), 18, 30);
    await db.update(t.pagos).set({ fecha: date }).where(eq(t.pagos.id, receipt.id));
    await db.update(t.movimientosCuenta).set({ fecha: date }).where(eq(t.movimientosCuenta.pagoId, receipt.id));
  }

  console.log("Listo:");
  console.log(
    `  ${categories.length} categorías, ${products.length} productos, ${customers.length} clientes, ${invoices.length} facturas`,
  );
  console.log("Usuarios de prueba:");
  console.log(`  admin    -> ${TEST_USERS.admin.email} / ${TEST_USERS.admin.password}`);
  console.log(`  vendedor -> ${TEST_USERS.vendedor.email} / ${TEST_USERS.vendedor.password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
