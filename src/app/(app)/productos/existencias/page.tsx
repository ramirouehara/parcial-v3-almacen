import type { Metadata } from "next";
import { DateRangeFilter } from "@/components/common/date-range-filter";
import { PageHeader } from "@/components/common/page-header";
import { Paginator } from "@/components/common/paginator";
import { EmptyState } from "@/components/common/states";
import { UrlSelect } from "@/components/common/url-select";
import { Row, Stack } from "@/components/layout/primitives";
import { MovementsTable } from "@/components/products/movements-table";
import { ProductsTabs } from "@/components/products/products-tabs";
import { requirePageUser } from "@/lib/session";
import { listMovements } from "@/services/stock";

export const metadata: Metadata = { title: "Existencias" };

/** /productos/existencias: todos los movimientos de stock, con filtros (RF-P6). */
export default async function StockPage({ searchParams }: PageProps<"/productos/existencias">) {
  const user = await requirePageUser();
  const params = (await searchParams) as Record<string, string | undefined>;
  const result = await listMovements(user, params);

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
