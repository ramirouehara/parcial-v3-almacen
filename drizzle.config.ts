// Configuración de drizzle-kit, la herramienta de línea de comandos que crea y corre
// las migraciones (`pnpm run db:generate` y `pnpm run db:migrate`).
import "dotenv/config"; // drizzle-kit no lee el .env por su cuenta
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/esquema.ts", // dónde están definidas las tablas
  out: "./src/db/migrations", // dónde van los archivos SQL generados
  dialect: "turso", // libSQL: funciona con un archivo local y con Turso
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./data/almacen.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  },
});
