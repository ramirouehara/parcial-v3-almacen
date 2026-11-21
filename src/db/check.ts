/**
 * Control de consistencia: `pnpm run db:check` (§10.8 puntos 5 y 4 del enunciado).
 *
 * Revisa directamente en la base que se cumplan las reglas que nunca se pueden romper.
 * Si algo falla, lo lista y termina con código 1. Sirve para mostrar en la defensa
 * que los datos de prueba (y los que se carguen en vivo) están sanos.
 */
import { sql } from "drizzle-orm";
import { db } from "./client";

type Check = { name: string; query: ReturnType<typeof sql> };

// Cada consulta devuelve las filas que ROMPEN la regla: si no devuelve nada, está bien.
const CHECKS: Check[] = [
  {
    name: "Regla 2: la existencia de cada producto es la suma de sus movimientos",
    query: sql`select p.codigo, p.existencia, coalesce(sum(m.cantidad), 0) as suma
               from productos p left join movimientos_stock m on m.producto_id = p.id
               group by p.id having p.existencia <> coalesce(sum(m.cantidad), 0)`,
  },
  {
    name: "Regla 1: ninguna existencia es negativa",
    query: sql`select codigo, existencia from productos where existencia < 0`,
  },
  {
    name: "Regla 8: ningún cliente tiene saldo a favor",
    query: sql`select c.nombre, sum(case when m.tipo = 'debito' then m.importe else -m.importe end) as saldo
               from clientes c join movimientos_cuenta m on m.cliente_id = c.id
               group by c.id having saldo < 0`,
  },
  {
    name: "Regla 7: cada venta a cuenta corriente tiene su débito por el total",
    query: sql`select f.numero from facturas f
               where f.forma_pago = 'cuenta_corriente' and not exists (
                 select 1 from movimientos_cuenta m
                 where m.factura_id = f.id and m.tipo = 'debito' and m.importe = f.total)`,
  },
  {
    name: "Cada pago tiene su crédito en la cuenta por el mismo importe",
    query: sql`select p.numero_recibo from pagos p where not exists (
                 select 1 from movimientos_cuenta m where m.pago_id = p.id and m.tipo = 'credito' and m.importe = p.importe)`,
  },
  {
    name: "Regla 4: la numeración de facturas no tiene huecos",
    query: sql`select punto_venta, count(*) as cantidad, max(numero) as ultimo from facturas
               group by punto_venta having count(*) <> max(numero)`,
  },
  {
    name: "Regla 4: la numeración de recibos no tiene huecos",
    query: sql`select count(*) as cantidad, max(numero_recibo) as ultimo from pagos having count(*) <> max(numero_recibo)`,
  },
  {
    name: "El total de cada factura es la suma de sus renglones",
    query: sql`select f.numero, f.total, sum(i.subtotal) as suma from facturas f
               join factura_items i on i.factura_id = f.id
               group by f.id having f.total <> sum(i.subtotal)`,
  },
  {
    name: "Cada renglón: subtotal = precio unitario × cantidad",
    query: sql`select factura_id, codigo from factura_items where subtotal <> precio_unitario * cantidad`,
  },
  {
    name: "Regla 9: de la tarjeta solo hay últimos 4 dígitos",
    query: sql`select numero from facturas where tarjeta_ultimos4 is not null and length(tarjeta_ultimos4) <> 4`,
  },
];

async function main() {
  let failures = 0;
  for (const check of CHECKS) {
    const rows = await db.all(check.query);
    if (rows.length === 0) {
      console.log(`OK    ${check.name}`);
    } else {
      failures++;
      console.log(`FALLA ${check.name}`);
      for (const row of rows) console.log("      ", row);
    }
  }
  console.log(failures === 0 ? "\nTodo en orden." : `\n${failures} control(es) con problemas.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
