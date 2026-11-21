import { describe, expect, it } from "vitest";
import { formatDocument, formatInvoiceNumber, formatMoney, formatReceiptNumber, parseMoney } from "@/lib/formato";

describe("formatos (regla 10 y §8 Formatos locales)", () => {
  it("muestra los centavos en pesos con formato argentino", () => {
    expect(formatMoney(1234550)).toBe("$ 12.345,50");
    expect(formatMoney(0)).toBe("$ 0,00");
    expect(formatMoney(-50000)).toBe("-$ 500,00");
  });

  it("lee lo que escribe la persona: punto de miles y coma decimal", () => {
    expect(parseMoney("12.345,50")).toBe(1234550);
    expect(parseMoney("50.000")).toBe(5000000);
    expect(parseMoney("50,5")).toBe(5050);
    expect(parseMoney("$ 1.000")).toBe(100000);
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("12,345,5")).toBeNaN();
  });

  it("arma los números de factura y de recibo (regla 4)", () => {
    expect(formatInvoiceNumber(1, 42)).toBe("0001-00000042");
    expect(formatReceiptNumber(1, 7)).toBe("R 0001-00000007");
  });

  it("agrega puntos al DNI y guiones al CUIT", () => {
    expect(formatDocument("DNI", "28456123")).toBe("28.456.123");
    expect(formatDocument("CUIT", "20284561234")).toBe("20-28456123-4");
  });
});
