/** Los nombres en castellano de los valores que guarda la base (para mostrar en pantalla). */

export const formaPagoLabels = {
  contado: "Contado",
  tarjeta: "Tarjeta",
  cuenta_corriente: "Cuenta corriente",
} as const;

export const medioPagoLabels = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Tarjeta de débito",
} as const;

export const tarjetaTipoLabels = { debito: "Débito", credito: "Crédito" } as const;
