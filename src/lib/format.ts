/**
 * El ÚNICO módulo de formatos (§10.6): moneda, fecha, hora, documento y numeración.
 * Los componentes no formatean por su cuenta: llaman a estas funciones.
 * Sirve en el servidor y en el navegador (no importa nada de la base).
 */

/** Zona horaria de Argentina (§8 Formatos locales). Argentina no tiene horario de verano. */
export const TIME_ZONE = "America/Argentina/Buenos_Aires";

const number2 = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Centavos -> "$ 12.345,50" (regla 10). La plata siempre viaja en centavos enteros. */
export function formatMoney(cents: number): string {
  const text = number2.format(Math.abs(cents) / 100);
  return cents < 0 ? `-$ ${text}` : `$ ${text}`;
}

/** Centavos -> "12.345,50", sin el signo $ (para mostrar dentro de un campo de importe). */
export function formatMoneyInput(cents: number): string {
  return number2.format(cents / 100);
}

/**
 * Lo que escribe la persona en un campo de importe -> centavos.
 * Formato argentino: el punto separa miles y la coma, decimales.
 *   "12.345,50" -> 1234550   "50.000" -> 5000000   "50,5" -> 5050   "" -> null
 * Devuelve NaN si el texto no es un importe válido.
 */
export function parseMoney(text: string): number | null {
  const clean = text.replace(/\$/g, "").replace(/\s/g, "");
  if (clean === "") return null;
  if (!/^\d{1,3}(\.?\d{3})*(,\d{1,2})?$/.test(clean)) return Number.NaN;
  const [whole, decimals = ""] = clean.replace(/\./g, "").split(",");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}

const dateFormat = new Intl.DateTimeFormat("es-AR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("es-AR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

/** "29/10/2026", en hora de Argentina. */
export function formatDate(value: Date | string): string {
  return dateFormat.format(toDate(value));
}

/** "18:24", en hora de Argentina. */
export function formatTime(value: Date | string): string {
  return timeFormat.format(toDate(value));
}

/** "29/10/2026 18:24". */
export function formatDateTime(value: Date | string): string {
  return `${formatDate(value)} ${formatTime(value)}`;
}

/** DNI "28456123" -> "28.456.123"; CUIT "20284561234" -> "20-28456123-4". */
export function formatDocument(tipoDoc: "DNI" | "CUIT", nroDoc: string): string {
  if (tipoDoc === "CUIT" && nroDoc.length === 11) {
    return `${nroDoc.slice(0, 2)}-${nroDoc.slice(2, 10)}-${nroDoc.slice(10)}`;
  }
  return nroDoc.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Punto de venta y número -> "0001-00000042" (regla 4). */
export function formatInvoiceNumber(puntoVenta: number, numero: number): string {
  return `${String(puntoVenta).padStart(4, "0")}-${String(numero).padStart(8, "0")}`;
}

/** Número de recibo -> "R-00000012" (los recibos tienen su propia numeración, regla 4). */
export function formatReceiptNumber(numero: number): string {
  return `R-${String(numero).padStart(8, "0")}`;
}

/**
 * Un día "AAAA-MM-DD" interpretado en hora de Argentina (§11.1) -> el instante en que empieza.
 * Argentina está siempre en UTC-3.
 */
export function startOfDayAR(day: string): Date {
  return new Date(`${day}T00:00:00-03:00`);
}

/** El día de hoy en Argentina, como "AAAA-MM-DD". */
export function todayAR(now = new Date()): string {
  // en-CA da el formato AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

/** Suma días a un "AAAA-MM-DD". */
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
