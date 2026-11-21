import type { Metadata } from "next";
import { DateRangeFilter } from "@/components/comunes/filtro-fechas";
import { PageHeader } from "@/components/comunes/encabezado-pagina";
import { Paginator } from "@/components/comunes/paginador";
import { EmptyState } from "@/components/comunes/estados";
import { UrlSelect } from "@/components/comunes/filtro-url";
import { Row, Stack } from "@/components/maquetacion/primitivas";
import { MovementsTable } from "@/components/productos/tabla-movimientos";
import { ProductsTabs } from "@/components/productos/pestanas-productos";
import { requirePageUser } from "@/lib/sesion";
import { listarMovimientos } from "@/servicios/stock";

export const metadata: Metadata = { title: "Existencias" };

/** /productos/existencias: todos los movimientos de stock, con filtros (RF-P6). */
export default async function StockPage({ searchParams }: PageProps<"/productos/existencias">) {
  const user = await requirePageUser();
  const params = (await searchParams) as Record<string, string | undefined>;
  const result = await listarMovimientos(user, params);

  return (
    <>
      <PageHeader title="Productos" description="Cada cambio de existencia queda registrado (regla 2)." />
      <ProductsTabs />
      <Row gap={2}>
        <UrlSelect
          param="tipo"
          label="Tipo"
          options={[
            { value: "venta", label: "Ventas" },
            { value: "anulacion", label: "Anulaciones" },
            { value: "ingreso", label: "Ingresos" },
            { value: "egreso", label: "Egresos" },
          ]}
        />
        <DateRangeFilter />
      </Row>
      {result.data.length === 0 ? (
        <EmptyState title="No hay movimientos con ese filtro" />
      ) : (
        <Stack gap={3}>
          <Stack gap={0} className="rounded-lg border bg-card">
            <MovementsTable movements={result.data} showProduct />
          </Stack>
          <Paginator page={result.page} pageSize={result.pageSize} total={result.total} searchParams={params} />
        </Stack>
      )}
    </>
  );
}
