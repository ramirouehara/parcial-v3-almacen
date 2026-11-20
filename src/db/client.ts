/**
 * Database connection.
 *
 * The same code talks to a local SQLite file in development and to Turso
 * (remote libSQL) in production. The only difference is the environment:
 *   development: DATABASE_URL=file:./data/almacen.db  (no token)
 *   production:  DATABASE_URL=libsql://...turso.io   + DATABASE_AUTH_TOKEN
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./data/almacen.db",
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});

// `db` is what every service imports to read and write.
// Passing the schema lets Drizzle know the tables and their columns.
export const db = drizzle(client, { schema });
