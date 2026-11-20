import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/states";

export const metadata: Metadata = { title: "Clientes" };

// Placeholder so the sidebar link works. The real screen arrives in commit 5.
export default function Page() {
  return (
    <>
      <PageHeader title="Clientes" />
      <EmptyState title="Pantalla en construcción" description="Clientes, cuenta corriente y pagos." />
    </>
  );
}
