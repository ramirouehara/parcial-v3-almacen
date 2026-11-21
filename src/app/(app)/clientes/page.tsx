import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/states";

export const metadata: Metadata = { title: "Clientes" };

// Página provisoria para que funcione el enlace del panel. La pantalla real llega en el commit 5.
export default function Page() {
  return (
    <>
      <PageHeader title="Clientes" />
      <EmptyState title="Pantalla en construcción" description="Clientes, cuenta corriente y pagos." />
    </>
  );
}
