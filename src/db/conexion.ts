/**
 * Conexión con la base de datos.
 *
 * El mismo código habla con un archivo SQLite local en desarrollo y con Turso
 * (libSQL remoto) en producción. Lo único que cambia es el entorno:
 *   desarrollo: DATABASE_URL=file:./data/almacen.db  (sin token)
 *   producción: DATABASE_URL=libsql://...turso.io   + DATABASE_AUTH_TOKEN
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./esquema";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./data/almacen.db",
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});

// `db` es lo que importa cada servicio para leer y escribir.
// Al pasarle el esquema, Drizzle conoce las tablas y sus columnas.
export const db = drizzle(client, { schema });

/** La transacción que reciben las funciones que escriben varias tablas a la vez. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Cola de escrituras: las transacciones de ESTE proceso corren de a una.
// SQLite admite un solo escritor a la vez; si dos transacciones locales arrancan
// juntas, la segunda fallaría con "base ocupada" en vez de esperar su turno.
// En Turso el propio servidor las ordena. La corrección del stock NO depende de
// esta cola: la garantiza el UPDATE condicional de moverStock().
let queue: Promise<unknown> = Promise.resolve();

/**
 * Corre `fn` dentro de una transacción de escritura (§10.2): o se graba todo o nada.
 * Si `fn` lanza un error, se deshace todo lo que hizo.
 */
export function writeTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  const run = queue.then(() => db.transaction(fn));
  // La cola sigue aunque esta transacción falle.
  queue = run.catch(() => undefined);
  return run;
}
