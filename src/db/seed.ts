/**
 * Script de datos iniciales: `pnpm run db:seed`.
 *
 * Arranca de una base vacía y carga los datos A TRAVÉS DE LOS SERVICIOS,
 * los mismos que usa la app (§10.7), así los datos cumplen todas las reglas.
 *
 * Por ahora solo crea los dos usuarios de prueba (RF-U3: el primer admin se
 * crea acá). El último commit agrega categorías, productos, clientes y facturas.
 */
import { sql } from "drizzle-orm";
import { db } from "./client";
import * as t from "./schema";
import { createUser, insertUser } from "@/services/users";

// Usuarios de prueba, uno por rol (el README los lista para la defensa).
export const TEST_USERS = {
  admin: { nombre: "Lucía Quispe", email: "admin@reydani.test", password: "admin1234" },
  vendedor: { nombre: "Martín Flores", email: "vendedor@reydani.test", password: "vendedor1234" },
};

/** Borra todas las filas, primero las hijas, así ninguna clave foránea queda apuntando a la nada. */
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
  // Reinicia los contadores autoincrementales, así los ids vuelven a empezar en 1.
  await db.run(sql`DELETE FROM sqlite_sequence`);
}

async function main() {
  console.log("Clearing the database...");
  await clearDatabase();

  // RF-U3: todavía no hay admin, así que el primero se crea directo.
  const admin = await insertUser({ ...TEST_USERS.admin, rol: "admin" });
  // De acá en adelante, todo pasa por los servicios normales, actuando como ese admin.
  await createUser(admin, { ...TEST_USERS.vendedor, rol: "vendedor" });

  console.log("Users created:");
  console.log(`  admin    -> ${TEST_USERS.admin.email} / ${TEST_USERS.admin.password}`);
  console.log(`  vendedor -> ${TEST_USERS.vendedor.email} / ${TEST_USERS.vendedor.password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
