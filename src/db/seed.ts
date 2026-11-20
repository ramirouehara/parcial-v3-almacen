/**
 * Initial data script: `pnpm run db:seed`.
 *
 * It starts from an empty database and loads the data THROUGH THE SERVICES,
 * the same ones the app uses (§10.7), so the data follows every rule.
 *
 * For now it only creates the two test users (RF-U3: the first admin is
 * created here). The last commit adds categories, products, customers and invoices.
 */
import { sql } from "drizzle-orm";
import { db } from "./client";
import * as t from "./schema";
import { createUser, insertUser } from "@/services/users";

// Test users, one per role (the README lists them for the defense).
export const TEST_USERS = {
  admin: { nombre: "Lucía Quispe", email: "admin@reydani.test", password: "admin1234" },
  vendedor: { nombre: "Martín Flores", email: "vendedor@reydani.test", password: "vendedor1234" },
};

/** Deletes every row, children first so no foreign key is left pointing nowhere. */
async function clearDatabase() {
  await db.delete(t.movimientosCuenta);
  await db.delete(t.movimientosStock);
  await db.delete(t.facturaItems);
  await db.delete(t.pagos);
  await db.delete(t.facturas);
  await db.delete(t.clientes);
  await db.delete(t.productos);
  await db.delete(t.categorias);
  await db.delete(t.usuarios);
  // Restart the auto-increment counters, so ids start at 1 again.
  await db.run(sql`DELETE FROM sqlite_sequence`);
}

async function main() {
  console.log("Clearing the database...");
  await clearDatabase();

  // RF-U3: there is no admin yet, so the first one is created directly.
  const admin = await insertUser({ ...TEST_USERS.admin, rol: "admin" });
  // From here on, everything goes through the normal services, as that admin.
  await createUser(admin, { ...TEST_USERS.vendedor, rol: "vendedor" });

  console.log("Users created:");
  console.log(`  admin    -> ${TEST_USERS.admin.email} / ${TEST_USERS.admin.password}`);
  console.log(`  vendedor -> ${TEST_USERS.vendedor.email} / ${TEST_USERS.vendedor.password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
