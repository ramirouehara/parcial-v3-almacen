import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Tres fuentes, tres trabajos: títulos, texto común y números (precios, números de factura).
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"] });
const body = Figtree({ variable: "--font-body", subsets: ["latin"] });
const numbers = IBM_Plex_Mono({
  variable: "--font-numbers",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: { default: "Almacén Rey Dani", template: "%s · Almacén Rey Dani" },
  description: "Gestión comercial del almacén: ventas, stock y libreta de cuentas corrientes.",
};

// Layout raíz: envuelve TODAS las páginas, incluido /login. El panel lateral vive en un
// layout anidado (el de (app)), así la pantalla de login queda afuera.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${display.variable} ${body.variable} ${numbers.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
