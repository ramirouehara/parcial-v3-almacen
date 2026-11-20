import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/states";

export const metadata: Metadata = { title: "Ventas" };

// Placeholder so the sidebar link works. The real screen arrives in commit 6.
export default function Page() {
  return (
    <>
      <PageHeader title="Ventas" />
      <EmptyState title="Pantalla en construcción" description="Nueva venta, facturas, comprobante y anulación." />
    </>
  );
}
