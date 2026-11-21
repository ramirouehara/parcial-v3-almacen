"use server";

/**
 * Server Actions de facturas. La confirmación de la venta usa la API REST (POST /api/facturas,
 * §10.6); la anulación usa esta acción. Las dos llaman al mismo servicio.
 */
import { action } from "@/lib/accion";
import { anularFactura } from "@/servicios/facturas";

export const anularFacturaAccion = action((user, id: number, input: unknown) => anularFactura(user, id, input));
