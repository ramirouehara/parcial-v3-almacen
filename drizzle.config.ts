// Configuration for drizzle-kit, the command-line tool that creates and runs
// migrations (`pnpm run db:generate` and `pnpm run db:migrate`).
import "dotenv/config"; // drizzle-kit does not read .env by itself
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts", // where the tables are defined
  out: "./src/db/migrations", // where the generated SQL files go
  dialect: "turso", // libSQL: works with a local file and with Turso
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./data/almacen.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  },
});
