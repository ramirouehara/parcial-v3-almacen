"use server";

/** Server Actions de clientes y pagos (RF-C2, RF-C5, RF-C7). Los mismos servicios que la API. */
import { action } from "@/lib/accion";
import { crearCliente, actualizarCliente } from "@/servicios/clientes";
import { registrarPago } from "@/servicios/pagos";

export const crearClienteAccion = action((user, input: unknown) => crearCliente(user, input));

export const actualizarClienteAccion = action((user, id: number, input: unknown) => actualizarCliente(user, id, input));

export const registrarPagoAccion = action((user, customerId: number, input: unknown) =>
  registrarPago(user, customerId, input),
);
