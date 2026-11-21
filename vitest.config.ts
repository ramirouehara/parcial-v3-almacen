// Configuración de Vitest (`pnpm test`). Cada archivo de test usa su propia base
// SQLite temporal, que arma tests/preparacion.ts: nunca toca data/almacen.db.
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    setupFiles: ["./tests/preparacion.ts"],
  },
});
