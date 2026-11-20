import type { NextConfig } from "next";

// cacheComponents and partialPrefetching are intentionally OFF: every screen
// depends on the logged-in user and on live data (stock, balances), so pages
// render on each request. That keeps the data flow simple to follow.
//
// Tailwind is configured in postcss.config.mjs (the setup from the Next docs).
// The template's "@tailwindcss/turbopack" loader was removed: in development it
// served the CSS one save behind.
const nextConfig: NextConfig = {
  // The libSQL driver ships native code; Next must load it from node_modules
  // instead of bundling it.
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
