import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DateRangeFilter } from "@/components/comunes/filtro-fechas";
import { PageHeader } from "@/components/comunes/encabezado-pagina";
import { Paginator } from "@/components/comunes/paginador";
import { SearchBox } from "@/components/comunes/buscador";
import { EmptyState } from "@/components/comunes/estados";
import { UrlSelect } from "@/components/comunes/filtro-url";
import { Row, Stack, Text } from "@/components/maquetacion/primitivas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatMoney } from "@/lib/formato";
import { formaPagoLabels } from "@/lib/etiquetas";
import { requirePageUser } from "@/lib/sesion";
import { listarFacturas, listarVendedores } from "@/servicios/facturas";

export const metadata: Metadata = { title: "Ventas" };

/** /ventas (RF-V8): facturas con filtros por fecha, cliente, forma de pago, vendedor y número. */
export default async function InvoicesPage({ searchParams }: PageProps<"/ventas">) {
  const user = await requirePageUser();
  const params = (await searchParams) as Record<string, string | undefined>;
  const [result, sellers] = await Promise.all([listarFacturas(user, params), listarVendedores()]);

  return (
    <>
      <PageHeader
        title="Ventas"
        description="Facturas emitidas y anuladas."
        actions={
          <Button asChild>
            <Link href="/ventas/nueva">
              <Plus /> Nueva venta
            </Link>
          </Button>
        }
      />
      <Row gap={2}>
        <SearchBox placeholder="Número o cliente" />
        <UrlSelect
          param="forma"
          label="Forma de pago"
          options={[
            { value: "contado", label: formaPagoLabels.contado },
            { value: "tarjeta", label: formaPagoLabels.tarjeta },
            { value: "cuenta_corriente", label: formaPagoLabels.cuenta_corriente },
          ]}
        />
        <UrlSelect
          param="estado"
          label="Estado"
          options={[
            { value: "emitida", label: "Emitidas" },
            { value: "anulada", label: "Anuladas" },
          ]}
        />
        <UrlSelect param="vendedorId" label="Vendedor" options={sellers.map((s) => ({ value: String(s.id), label: s.nombre }))} />
        <DateRangeFilter />
      </Row>
      <Card>
        <CardContent>
          <Row justify="between">
            <Text variant="muted">Total emitido con este filtro (sin anuladas)</Text>
            <Text variant="number" className="text-xl">
              {formatMoney(result.totalEmitido)}
            </Text>
          </Row>
        </CardContent>
      </Card>

      {result.data.length === 0 ? (
        <EmptyState title="No hay facturas con ese filtro" description="Probá con otras fechas o cargá una venta." />
      ) : (
        <Stack gap={3}>
          <Stack gap={0} className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Forma de pago</TableHead>
                  <TableHead className="hidden lg:table-cell">Vendedor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.map((f) => (
                  <TableRow key={f.id} className={f.estado === "anulada" ? "opacity-60" : undefined}>
                    <TableCell>
                      <Link href={`/ventas/${f.id}`} className="font-mono text-sm hover:underline">
                        {f.numeroFormateado}
                      </Link>
                      {f.estado === "anulada" && (
                        <Badge variant="outline" className="ml-2 text-destructive">
                          Anulada
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Text variant="number">{formatDateTime(f.fecha)}</Text>
                    </TableCell>
                    <TableCell>
                      {f.cliente ? (
                        <Link href={`/clientes/${f.cliente.id}`} className="hover:underline">
                          {f.cliente.nombre}
                        </Link>
                      ) : (
                        <Text variant="muted">Consumidor final</Text>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formaPagoLabels[f.formaPago]}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Text variant="muted">{f.vendedor.nombre}</Text>
                    </TableCell>
                    <TableCell className="text-right">
                      <Text variant="number">{formatMoney(f.total)}</Text>
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
