import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Paginator } from "@/components/common/paginator";
import { SearchBox } from "@/components/common/search-box";
import { EmptyState } from "@/components/common/states";
import { ActiveBadge } from "@/components/common/status-badge";
import { UrlSelect } from "@/components/common/url-select";
import { BalanceText } from "@/components/customers/balance-text";
import { CustomerActions } from "@/components/customers/customer-actions";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { CustomersTabs } from "@/components/customers/customers-tabs";
import { Row, Stack, Text } from "@/components/layout/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDocument } from "@/lib/format";
import { requirePageUser } from "@/lib/session";
import { listCustomers } from "@/services/customers";

export const metadata: Metadata = { title: "Clientes" };

/** /clientes (RF-C1): búsqueda por nombre o documento, con el saldo de cada cliente. */
export default async function CustomersPage({ searchParams }: PageProps<"/clientes">) {
  const user = await requirePageUser();
  const params = (await searchParams) as Record<string, string | undefined>;
  const result = await listCustomers(user, params);

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Datos, cuenta corriente y pagos."
        actions={
          <CustomerFormDialog
            trigger={
              <Button>
                <Plus /> Nuevo cliente
              </Button>
            }
          />
        }
      />
      <CustomersTabs />
      <Row gap={2}>
        <SearchBox placeholder="Buscar por nombre o documento" />
        <UrlSelect
          param="activo"
          label="Estado"
          allLabel="Estado: activos"
          options={[
            { value: "false", label: "Dados de baja" },
            { value: "todos", label: "Activos y de baja" },
          ]}
        />
      </Row>

      {result.data.length === 0 ? (
        <EmptyState title="No hay clientes con ese filtro" description="Probá con otra búsqueda o cargá uno nuevo." />
      ) : (
        <Stack gap={3}>
          <Stack gap={0} className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Documento</TableHead>
                  <TableHead className="hidden md:table-cell">Cuenta corriente</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/clientes/${c.id}`} className="hover:underline">
                        <Text as="span" variant="strong">
                          {c.nombre}
                        </Text>
                      </Link>
                      <Row gap={2}>
                        <Text variant="small" className="sm:hidden">
                          {c.tipoDoc} {formatDocument(c.tipoDoc, c.nroDoc)}
                        </Text>
                        {!c.activo && <ActiveBadge active={false} />}
                      </Row>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Text variant="number">
                        {c.tipoDoc} {formatDocument(c.tipoDoc, c.nroDoc)}
                      </Text>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {c.cuentaCorriente ? <Badge variant="secondary">Habilitada</Badge> : <Text variant="muted">No</Text>}
                    </TableCell>
                    <TableCell className="text-right">
                      <BalanceText saldo={c.saldo} />
                    </TableCell>
                    <TableCell>
                      <CustomerActions customer={c} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
          <Paginator page={result.page} pageSize={result.pageSize} total={result.total} searchParams={params} />
        </Stack>
      )}
    </>
  );
}
