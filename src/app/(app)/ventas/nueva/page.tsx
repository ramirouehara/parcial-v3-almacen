import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { SaleForm } from "@/components/sales/sale-form";
import { requirePageUser } from "@/lib/session";

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
