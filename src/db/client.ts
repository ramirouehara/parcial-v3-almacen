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
import * as schema from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./data/almacen.db",
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});

// `db` es lo que importa cada servicio para leer y escribir.
// Al pasarle el esquema, Drizzle conoce las tablas y sus columnas.
export const db = drizzle(client, { schema });
