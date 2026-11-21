import { describe, expect, it } from "vitest";
import { createInvoiceSchema } from "@/schemas/invoices";
import { updateProductSchema } from "@/schemas/products";

describe("esquemas Zod compartidos (§10.4)", () => {
  it("el PATCH de producto rechaza la existencia", () => {
    const result = updateProductSchema.safeParse({ existencia: 100 });
    expect(result.success).toBe(false);
  });

  const base = { clienteId: null, items: [{ productoId: 1, cantidad: 1 }] };

  it("rechaza el número completo de la tarjeta (regla 9)", () => {
    const result = createInvoiceSchema.safeParse({
      ...base,
      pago: { forma: "tarjeta", tarjeta: { tipo: "credito", marca: "Visa", ultimos4: "1234", numero: "4111111111111234" } },
    });
    expect(result.success).toBe(false);
  });

  it("no acepta precios desde el cliente (§11.1)", () => {
    const result = createInvoiceSchema.safeParse({ ...base, items: [{ productoId: 1, cantidad: 1, precio: 1 }], pago: { forma: "contado" } });
    expect(result.success).toBe(false);
  });

  it("no acepta el mismo producto en dos renglones", () => {
    const result = createInvoiceSchema.safeParse({
      ...base,
      items: [
        { productoId: 1, cantidad: 1 },
        { productoId: 1, cantidad: 2 },
      ],
      pago: { forma: "contado" },
    });
    expect(result.success).toBe(false);
  });

  it("acepta una venta bien armada", () => {
    expect(createInvoiceSchema.safeParse({ ...base, pago: { forma: "contado" } }).success).toBe(true);
  });
});
