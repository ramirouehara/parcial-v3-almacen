/**
 * Tests de los servicios contra una base SQLite temporal (ver tests/preparacion.ts).
 * Cubren la lista de control del §10.8: permisos (2), transacciones sin datos a medias (3),
 * ventas simultáneas de la última unidad (4) y existencia = suma de movimientos (5).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db, writeTransaction } from "@/db/conexion";
import { facturas, movimientosStock, productos } from "@/db/esquema";
import { ApiError } from "@/lib/errores";
import { createCategory } from "@/servicios/categorias";
import { balanceOf, createCustomer, getCustomer, updateCustomer } from "@/servicios/clientes";
import { cancelInvoice, createInvoice } from "@/servicios/facturas";
import { registerPayment } from "@/servicios/pagos";
import type { AuthUser } from "@/servicios/permisos";
import { createProduct, getProduct } from "@/servicios/productos";
import { registerMovement } from "@/servicios/stock";
import { createUser, insertUser } from "@/servicios/usuarios";

let admin: AuthUser;
let vendedor: AuthUser;
let categoryId: number;

/** Espera que la promesa falle con un ApiError de ese status y código. */
async function expectApiError(promise: Promise<unknown>, status: number, code: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).status).toBe(status);
  expect((error as ApiError).code).toBe(code);
}

async function newProduct(codigo: string, stockInicial: number, precio = 100000) {
  return createProduct(admin, { codigo, descripcion: `Producto ${codigo}`, categoriaId: categoryId, precio, stockMinimo: 0, stockInicial });
}

const countInvoices = async () => db.$count(facturas);
const movementSum = async (productId: number) => {
  const [row] = await db
    .select({ s: sql<number>`coalesce(sum(${movimientosStock.cantidad}), 0)` })
    .from(movimientosStock)
    .where(eq(movimientosStock.productoId, productId));
  return Number(row.s);
};

beforeAll(async () => {
  admin = await insertUser({ nombre: "Admin Test", email: "admin@test.test", rol: "admin", password: "admin1234" });
  vendedor = await createUser(admin, { nombre: "Vendedor Test", email: "vend@test.test", rol: "vendedor", password: "vend12345" });
  categoryId = (await createCategory(admin, { nombre: "General" })).id;
});

describe("permisos (§10.8 punto 2)", () => {
  it("un vendedor no puede crear productos: 403", async () => {
    await expectApiError(
      createProduct(vendedor, { codigo: "X-1", descripcion: "X", categoriaId: categoryId, precio: 100, stockMinimo: 0 }),
      403,
      "SIN_PERMISO",
    );
  });

  it("un vendedor no puede anular facturas: 403", async () => {
    await expectApiError(cancelInvoice(vendedor, 1, { motivo: "x" }), 403, "SIN_PERMISO");
  });
});

describe("stock (reglas 1 y 2)", () => {
  it("un egreso que deja la existencia en negativo da 409 y no cambia nada", async () => {
    const product = await newProduct("ST-1", 3);
    await expectApiError(
      registerMovement(admin, product.id, { tipo: "egreso", cantidad: 5, motivo: "Rotura" }),
      409,
      "STOCK_INSUFICIENTE",
    );
    expect((await getProduct(admin, product.id)).existencia).toBe(3);
    expect(await movementSum(product.id)).toBe(3);
  });
});

describe("facturas", () => {
  it("dos ventas simultáneas de la última unidad terminan con UNA factura (§10.8 punto 4)", async () => {
    const product = await newProduct("ULT-1", 1);
    const before = await countInvoices();
    const sale = () => createInvoice(vendedor, { clienteId: null, items: [{ productoId: product.id, cantidad: 1 }], pago: { forma: "contado" } });

    const results = await Promise.allSettled([sale(), sale()]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect((rejected.reason as ApiError).code).toBe("STOCK_INSUFICIENTE");
    expect(await countInvoices()).toBe(before + 1);
    expect((await getProduct(admin, product.id)).existencia).toBe(0);
    expect(await movementSum(product.id)).toBe(0);
  });

  it("una venta que supera el límite de crédito no graba NADA (§10.8 punto 3)", async () => {
    const product = await newProduct("LIM-1", 10, 1000000); // $ 10.000 cada uno
    const customer = await createCustomer(vendedor, {
      tipoDoc: "DNI",
      nroDoc: "30111222",
      nombre: "Cliente Límite",
      cuentaCorriente: true,
      limiteCredito: 1500000, // $ 15.000
    });
    const before = await countInvoices();

    await expectApiError(
      createInvoice(vendedor, { clienteId: customer.id, items: [{ productoId: product.id, cantidad: 2 }], pago: { forma: "cuenta_corriente" } }),
      422,
      "LIMITE_CREDITO_EXCEDIDO",
    );
    expect(await countInvoices()).toBe(before);
    expect((await getProduct(admin, product.id)).existencia).toBe(10);
    expect(await balanceOf(customer.id)).toBe(0);
  });

  it("si algo falla dentro de la transacción, se deshace lo ya escrito", async () => {
    const before = await countInvoices();
    await expect(
      writeTransaction(async (tx) => {
        await tx.insert(facturas).values({ puntoVenta: 9, numero: 1, usuarioId: admin.id, total: 1, formaPago: "contado" });
        throw new Error("falla a mitad de camino");
      }),
    ).rejects.toThrow("falla a mitad de camino");
    expect(await countInvoices()).toBe(before);
  });

  it("consumidor final no compra en cuenta corriente (regla 6)", async () => {
    const product = await newProduct("CF-1", 5);
    await expectApiError(
      createInvoice(vendedor, { clienteId: null, items: [{ productoId: product.id, cantidad: 1 }], pago: { forma: "cuenta_corriente" } }),
      422,
      "CUENTA_CORRIENTE_NO_HABILITADA",
    );
  });

  it("el precio queda congelado en la factura (regla 3)", async () => {
    const product = await newProduct("PR-1", 5, 200000);
    const invoice = await createInvoice(vendedor, { clienteId: null, items: [{ productoId: product.id, cantidad: 2 }], pago: { forma: "contado" } });
    await db.update(productos).set({ precio: 999999 }).where(eq(productos.id, product.id));
    const [row] = await db.select().from(facturas).where(eq(facturas.id, invoice.id));
    expect(invoice.total).toBe(400000);
    expect(row.total).toBe(400000);
  });

  it("la anulación devuelve el stock, acredita la cuenta y no se puede repetir (RF-V9)", async () => {
    const product = await newProduct("AN-1", 5, 100000);
    const customer = await createCustomer(vendedor, { tipoDoc: "DNI", nroDoc: "30999888", nombre: "Cliente Anulación", cuentaCorriente: true });
    const invoice = await createInvoice(vendedor, {
      clienteId: customer.id,
      items: [{ productoId: product.id, cantidad: 3 }],
      pago: { forma: "cuenta_corriente" },
    });
    expect(await balanceOf(customer.id)).toBe(300000);

    const cancelled = await cancelInvoice(admin, invoice.id, { motivo: "Error de carga" });
    expect(cancelled.estado).toBe("anulada");
    expect((await getProduct(admin, product.id)).existencia).toBe(5);
    expect(await movementSum(product.id)).toBe(5);
    expect(await balanceOf(customer.id)).toBe(0);
    await expectApiError(cancelInvoice(admin, invoice.id, { motivo: "otra vez" }), 409, "FACTURA_ANULADA");
  });
});

describe("pagos (regla 8)", () => {
  it("un pago no puede superar la deuda; uno menor la baja y genera recibo", async () => {
    const product = await newProduct("PA-1", 5, 100000);
    const customer = await createCustomer(vendedor, { tipoDoc: "DNI", nroDoc: "31555444", nombre: "Cliente Pago", cuentaCorriente: true });
    await createInvoice(vendedor, { clienteId: customer.id, items: [{ productoId: product.id, cantidad: 2 }], pago: { forma: "cuenta_corriente" } });

    await expectApiError(registerPayment(vendedor, customer.id, { importe: 300000, medio: "efectivo" }), 422, "PAGO_SUPERA_DEUDA");
    const receipt = await registerPayment(vendedor, customer.id, { importe: 50000, medio: "transferencia" });
    expect(receipt.numeroRecibo).toMatch(/^R 0001-\d{8}$/);
    expect(await balanceOf(customer.id)).toBe(150000);
  });
});

describe("clientes", () => {
  it("dar de baja a un cliente no le borra el email, el domicilio ni el teléfono", async () => {
    const customer = await createCustomer(vendedor, {
      tipoDoc: "DNI",
      nroDoc: "32777666",
      nombre: "Cliente Contacto",
      domicilio: "Las Heras 455",
      telefono: "381 455-2210",
      email: "contacto@correo.test",
    });
    await updateCustomer(vendedor, customer.id, { activo: false });
    const after = await getCustomer(vendedor, customer.id);
    expect(after.activo).toBe(false);
    expect(after.email).toBe("contacto@correo.test");
    expect(after.domicilio).toBe("Las Heras 455");
    expect(after.telefono).toBe("381 455-2210");
  });
});
