"use server";

/** Server Actions de clientes y pagos (RF-C2, RF-C5, RF-C7). Los mismos servicios que la API. */
import { action } from "@/lib/action";
import { createCustomer, updateCustomer } from "@/services/customers";
import { registerPayment } from "@/services/payments";

export const createCustomerAction = action((user, input: unknown) => createCustomer(user, input));

export const updateCustomerAction = action((user, id: number, input: unknown) => updateCustomer(user, id, input));

export const registerPaymentAction = action((user, customerId: number, input: unknown) =>
  registerPayment(user, customerId, input),
);
