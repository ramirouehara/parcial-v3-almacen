// Tailwind corre como plugin de PostCSS: es la configuración que usa la documentación de Next.js
// (node_modules/next/dist/docs/01-app/01-getting-started/11-css.md).
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
