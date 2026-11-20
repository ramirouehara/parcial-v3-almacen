// Tailwind runs as a PostCSS plugin: this is the setup the Next.js docs use
// (node_modules/next/dist/docs/01-app/01-getting-started/11-css.md).
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
