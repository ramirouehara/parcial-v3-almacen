/**
 * Datos del comercio que salen en las facturas y los recibos (RF-V7, RF-C5).
 * Solo el nombre es real; domicilio, CUIT y teléfono son de fantasía.
 */
export const STORE = {
  nombre: "Almacén Rey Dani",
  domicilio: "Av. Belgrano 1450, San Miguel de Tucumán",
  cuit: "30-71234567-0",
  telefono: "381 000 0000", // el mismo del logo
  condicionIva: "Responsable inscripto",
};

/**
 * Punto de venta de la numeración (regla 4): facturas "0001-00000042" y recibos "R 0001-00000012".
 * Para pasar a "0002" se cambia solo este número.
 */
export const PUNTO_VENTA = 1;
