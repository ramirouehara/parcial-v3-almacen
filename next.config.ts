import type { NextConfig } from "next";

// cacheComponents y partialPrefetching están APAGADOS a propósito: cada pantalla
// depende del usuario logueado y de datos en vivo (stock, saldos), así que las páginas
// se arman en cada pedido. Así el recorrido de los datos es fácil de seguir.
//
// Tailwind se configura en postcss.config.mjs (la forma que indica la documentación de Next).
// Se sacó el loader "@tailwindcss/turbopack" de la plantilla: en desarrollo
// servía el CSS con un guardado de atraso.
const nextConfig: NextConfig = {
  // El driver de libSQL trae código nativo; Next lo tiene que cargar desde node_modules
  // en vez de empaquetarlo.
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
