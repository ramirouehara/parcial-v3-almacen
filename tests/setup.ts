/**
 * Antes de cada archivo de test: una base SQLite nueva en una carpeta temporal,
 * con las mismas migraciones que la app. Así los tests no tocan los datos de desarrollo.
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const dir = mkdtempSync(path.join(tmpdir(), "almacen-test-"));
process.env.DATABASE_URL = `file:${path.join(dir, "test.db")}`;

// Se importa recién ahora, para que el cliente lea la DATABASE_URL de arriba.
const { db } = await import("@/db/client");
const { migrate } = await import("drizzle-orm/libsql/migrator");
await migrate(db, { migrationsFolder: path.resolve(__dirname, "../src/db/migrations") });
