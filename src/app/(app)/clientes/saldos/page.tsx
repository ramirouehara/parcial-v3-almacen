import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/comunes/encabezado-pagina";
import { Paginator } from "@/components/comunes/paginador";
import { EmptyState } from "@/components/comunes/estados";
import { BalanceText } from "@/components/clientes/saldo";
import { CustomersTabs } from "@/components/clientes/pestanas-clientes";
import { Row, Stack, Text } from "@/components/maquetacion/primitivas";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDocument, formatMoney } from "@/lib/formato";
import { requirePageUser } from "@/lib/sesion";
import { listCustomers } from "@/servicios/clientes";

export const metadata: Metadata = { title: "Saldos" };

/** /clientes/saldos (RF-C6): los clientes que deben, de mayor a menor, con el total adeudado. */
export default async function BalancesPage({ searchParams }: PageProps<"/clientes/saldos">) {
  const user = await requirePageUser();
  const params = (await searchParams) as Record<string, string | undefined>;
  const result = await listCustomers(user, { ...params, conDeuda: "true", orden: "saldo", activo: "todos" });

  return (
    <>
      <PageHeader title="Clientes" description="Quién nos debe y cuánto." />
      <CustomersTabs />
      <Card>
        <CardContent>
          <Row justify="between">
            <Text variant="muted">Total adeudado en cuentas corrientes</Text>
            <Text variant="number" className="text-2xl text-destructive">
              {formatMoney(result.totalAdeudado ?? 0)}
            </Text>
          </Row>
        </CardContent>
      </Card>
      {result.data.length === 0 ? (
        <EmptyState title="Nadie debe nada" description="Todas las cuentas corrientes están al día." />
      ) : (
        <Stack gap={3}>
          <Stack gap={0} className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Documento</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Límite</TableHead>
                  <TableHead className="text-right">Debe</TableHead>
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
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Text variant="number">{formatDocument(c.tipoDoc, c.nroDoc)}</Text>
                    </TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      <Text variant="number">{c.limiteCredito === null ? "Sin límite" : formatMoney(c.limiteCredito)}</Text>
                    </TableCell>
                    <TableCell className="text-right">
                      <BalanceText saldo={c.saldo} />
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
