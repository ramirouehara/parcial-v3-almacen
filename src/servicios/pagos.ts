/**
 * Servicio de pagos a cuenta corriente (RF-C5; reglas 4, 8 y 11). Ambos roles.
 * El pago y el crédito en la cuenta se graban en UNA transacción: o los dos o ninguno.
 */
import { eq, sql } from "drizzle-orm";
import { db, writeTransaction } from "@/db/conexion";
import { clientes, movimientosCuenta, pagos, usuarios } from "@/db/esquema";
import { ApiError, notFound } from "@/lib/errores";
import { formatMoney, formatReceiptNumber } from "@/lib/formato";
import { PUNTO_VENTA } from "@/lib/comercio";
import { parseInput } from "@/lib/validacion";
import { idParam } from "@/esquemas/comunes";
import { paymentSchema } from "@/esquemas/clientes";
import { saldoDe } from "./clientes";
import type { AuthUser } from "./permisos";

/** El recibo, tal como lo devuelve la API (§11.5). */
export type Receipt = {
  id: number;
  numeroRecibo: string;
  fecha: string;
  cliente: { id: number; nombre: string; tipoDoc: "DNI" | "CUIT"; nroDoc: string };
  importe: number;
  medio: "efectivo" | "transferencia" | "tarjeta_debito";
  observacion: string | null;
  usuario: { id: number; nombre: string };
  saldoCliente: number;
};

/**
 * POST /api/clientes/{id}/pagos (RF-C5).
 * - 422 CUENTA_CORRIENTE_NO_HABILITADA si el cliente no tiene cuenta corriente.
 * - 422 PAGO_SUPERA_DEUDA si el importe es mayor que el saldo (regla 8: no hay saldos a favor).
 * - El número de recibo es el siguiente al último, asignado DENTRO de la transacción (regla 4).
 */
export async function registrarPago(user: AuthUser, customerId: unknown, input: unknown): Promise<Receipt> {
  const clienteId = parseInput(idParam, customerId);
  const data = parseInput(paymentSchema, input);

  const paymentId = await writeTransaction(async (tx) => {
    const customer = await tx.query.clientes.findFirst({ where: eq(clientes.id, clienteId) });
    if (!customer) throw notFound("El cliente");
    if (!customer.cuentaCorriente) {
      throw new ApiError(422, "CUENTA_CORRIENTE_NO_HABILITADA", "El cliente no tiene cuenta corriente habilitada.");
    }

    // El saldo se calcula adentro de la transacción, así nadie lo cambia en el medio.
    const saldo = await saldoDe(clienteId, tx);
    if (data.importe > saldo) {
      throw new ApiError(422, "PAGO_SUPERA_DEUDA", "El pago no puede superar la deuda del cliente.", [
        { campo: "importe", mensaje: `La deuda es de ${formatMoney(saldo)}: el pago no puede ser mayor.` },
      ]);
    }

    const [{ ultimo }] = await tx.select({ ultimo: sql<number>`coalesce(max(${pagos.numeroRecibo}), 0)` }).from(pagos);
    const numeroRecibo = Number(ultimo) + 1;

    const [payment] = await tx
      .insert(pagos)
      .values({
        numeroRecibo,
        clienteId,
        usuarioId: user.id,
        importe: data.importe,
        medio: data.medio,
        observacion: data.observacion,
      })
      .returning({ id: pagos.id });

    await tx.insert(movimientosCuenta).values({
      clienteId,
      tipo: "credito",
      importe: data.importe,
      descripcion: `Recibo ${formatReceiptNumber(PUNTO_VENTA, numeroRecibo)}`,
      pagoId: payment.id,
      usuarioId: user.id,
    });
    return payment.id;
  });

  return obtenerPago(user, paymentId);
}

/** GET /api/pagos/{id}: el mismo recibo, para reimprimirlo. */
export async function obtenerPago(user: AuthUser, id: unknown): Promise<Receipt> {
  const paymentId = parseInput(idParam, id);
  const [row] = await db
    .select({
      p: pagos,
      cliente: { id: clientes.id, nombre: clientes.nombre, tipoDoc: clientes.tipoDoc, nroDoc: clientes.nroDoc },
      usuario: { id: usuarios.id, nombre: usuarios.nombre },
    })
    .from(pagos)
    .innerJoin(clientes, eq(pagos.clienteId, clientes.id))
    .innerJoin(usuarios, eq(pagos.usuarioId, usuarios.id))
    .where(eq(pagos.id, paymentId));
  if (!row) throw notFound("El recibo");

  return {
    id: row.p.id,
    numeroRecibo: formatReceiptNumber(PUNTO_VENTA, row.p.numeroRecibo),
    fecha: row.p.fecha.toISOString(),
    cliente: row.cliente,
    importe: row.p.importe,
    medio: row.p.medio,
    observacion: row.p.observacion,
    usuario: row.usuario,
    saldoCliente: await saldoDe(row.cliente.id),
  };
}
