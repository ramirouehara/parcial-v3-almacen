import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/states";
import { requirePageUser } from "@/lib/session";

// Home (/). The dashboard with indicators and charts (RF-T) replaces this
// placeholder in a later commit.
export default async function HomePage() {
  const user = await requirePageUser();
  return (
    <>
      <PageHeader title={`Hola, ${user.nombre.split(" ")[0]}`} description="Resumen del almacén." />
      <EmptyState
        title="El tablero llega más adelante"
        description="Acá vas a ver las ventas del día y del mes, los saldos y los productos para reponer."
      />
    </>
  );
}
