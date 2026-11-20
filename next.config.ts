import type { NextConfig } from "next";

// cacheComponents and partialPrefetching are intentionally OFF: every screen
// depends on the logged-in user and on live data (stock, balances), so pages
// render on each request. That keeps the data flow simple to follow.
const nextConfig: NextConfig = {
  // The libSQL driver ships native code; Next must load it from node_modules
  // instead of bundling it.
  serverExternalPackages: ["@libsql/client", "libsql"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
