import type { Metadata } from "next";
import { PageHeader } from "@/components/comunes/encabezado-pagina";
import { SaleForm } from "@/components/ventas/formulario-venta";
import { requirePageUser } from "@/lib/sesion";

export const metadata: Metadata = { title: "Nueva venta" };

/** /ventas/nueva (RF-V1): comprador, ítems y forma de pago en una sola pantalla. Ambos roles. */
export default async function NewSalePage() {
  await requirePageUser();
  return (
    <>
      <PageHeader title="Nueva venta" description="Buscá los productos, elegí cómo paga y confirmá." />
      <SaleForm />
    </>
  );
}
