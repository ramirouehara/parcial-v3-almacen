import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/states";

export const metadata: Metadata = { title: "Ventas" };

// Página provisoria para que funcione el enlace del panel. La pantalla real llega en el commit 6.
export default function Page() {
  return (
    <>
      <PageHeader title="Ventas" />
      <EmptyState title="Pantalla en construcción" description="Nueva venta, facturas, comprobante y anulación." />
    </>
  );
}
