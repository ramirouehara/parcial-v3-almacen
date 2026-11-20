import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/states";

export const metadata: Metadata = { title: "Productos" };

// Placeholder so the sidebar link works. The real screen arrives in commit 4.
export default function Page() {
  return (
    <>
      <PageHeader title="Productos" />
      <EmptyState title="Pantalla en construcción" description="Catálogo, categorías y movimientos de stock." />
    </>
  );
}
