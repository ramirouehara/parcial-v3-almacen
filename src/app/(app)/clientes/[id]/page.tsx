import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, HandCoins } from "lucide-react";
import { DateRangeFilter } from "@/components/comunes/filtro-fechas";
import { PageHeader } from "@/components/comunes/encabezado-pagina";
import { EmptyState } from "@/components/comunes/estados";
import { ActiveBadge } from "@/components/comunes/etiqueta-estado";
import { BalanceText } from "@/components/clientes/saldo";
import { CustomerActions } from "@/components/clientes/acciones-cliente";
import { PaymentDialog } from "@/components/clientes/dialogo-pago";
import { Grid, Row, Stack, Text, Title } from "@/components/maquetacion/primitivas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatDateTime, formatDocument, formatMoney } from "@/lib/formato";
import { formaPagoLabels } from "@/lib/etiquetas";
import { requirePageUser } from "@/lib/sesion";
import { getAccount, getCustomer } from "@/servicios/clientes";

export const metadata: Metadata = { title: "Cliente" };

/** /clientes/[id]: la ficha (RF-C3) con la cuenta corriente (RF-C4) y el registro de pagos (RF-C5). */
export default async function CustomerPage({ params, searchParams }: PageProps<"/clientes/[id]">) {
  const user = await requirePageUser();
  const { id } = await params;
  const query = (await searchParams) as Record<string, string | undefined>;
  const [customer, account] = await Promise.all([getCustomer(user, id), getAccount(user, id, query)]);

  return (
    <>
      <Link href="/clientes" className="text-sm text-muted-foreground hover:text-foreground">
        <Row gap={1}>
          <ArrowLeft className="size-4" /> Volver a clientes
        </Row>
      </Link>
      <PageHeader
        title={customer.nombre}
        description={`${customer.tipoDoc} ${formatDocument(customer.tipoDoc, customer.nroDoc)}`}
        actions={
          <>
            {customer.cuentaCorriente && customer.saldo > 0 && (
              <PaymentDialog
                customer={customer}
                trigger={
                  <Button>
                    <HandCoins /> Registrar pago
                  </Button>
                }
              />
            )}
            <CustomerActions customer={customer} />
          </>
        }
      />

      <Grid cols={4}>
        <Card>
          <CardContent>
            <Text variant="small">Saldo actual</Text>
            <BalanceText saldo={customer.saldo} className="text-xl" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Text variant="small">Cuenta corriente</Text>
            {customer.cuentaCorriente ? (
              <Badge variant="secondary">Habilitada</Badge>
            ) : (
              <Text variant="muted">No habilitada</Text>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Text variant="small">Límite / disponible</Text>
            <Text variant="number">
              {customer.limiteCredito === null
                ? "Sin límite"
                : `${formatMoney(customer.limiteCredito)} / ${formatMoney(customer.disponible ?? 0)}`}
            </Text>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Text variant="small">Contacto</Text>
            <Text>{customer.telefono ?? "Sin teléfono"}</Text>
            <Text variant="small">{customer.email ?? customer.domicilio ?? ""}</Text>
            {!customer.activo && <ActiveBadge active={false} />}
          </CardContent>
        </Card>
      </Grid>

      <Stack gap={3}>
        <Title level={2}>Últimas facturas</Title>
        {customer.ultimasFacturas.length === 0 ? (
          <EmptyState title="Todavía no tiene facturas" />
        ) : (
          <Stack gap={0} className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="hidden sm:table-cell">Forma de pago</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.ultimasFacturas.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Link href={`/ventas/${f.id}`} className="font-mono text-sm hover:underline">
                        {f.numero}
                      </Link>
                      {f.estado === "anulada" && (
                        <Badge variant="outline" className="ml-2 text-destructive">
                          Anulada
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Text variant="number">{formatDate(f.fecha)}</Text>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{formaPagoLabels[f.formaPago]}</TableCell>
                    <TableCell className="text-right">
                      <Text variant="number">{formatMoney(f.total)}</Text>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        )}
      </Stack>

      <Stack gap={3}>
        <Row justify="between">
          <Title level={2}>Cuenta corriente</Title>
          <DateRangeFilter />
        </Row>
        {account.movimientos.length === 0 ? (
          <EmptyState title="Sin movimientos en la cuenta" description="Las ventas a cuenta y los pagos aparecen acá." />
        ) : (
          <Stack gap={0} className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Debe</TableHead>
                  <TableHead className="text-right">Haber</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {account.saldoAnterior !== 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Text variant="muted">Saldo anterior</Text>
                    </TableCell>
                    <TableCell className="text-right">
                      <Text variant="number">{formatMoney(account.saldoAnterior)}</Text>
                    </TableCell>
                  </TableRow>
                )}
                {account.movimientos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Text variant="number">{formatDateTime(m.fecha)}</Text>
                    </TableCell>
                    <TableCell>
                      {m.facturaId ? (
                        <Link href={`/ventas/${m.facturaId}`} className="hover:underline">
                          {m.descripcion}
                        </Link>
                      ) : m.pagoId ? (
                        <Link href={`/clientes/recibos/${m.pagoId}`} className="hover:underline">
                          {m.descripcion}
                        </Link>
                      ) : (
                        m.descripcion
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Text variant="number">{m.tipo === "debito" ? formatMoney(m.importe) : ""}</Text>
                    </TableCell>
                    <TableCell className="text-right">
                      <Text variant="number" className="text-primary">
                        {m.tipo === "credito" ? formatMoney(m.importe) : ""}
                      </Text>
                    </TableCell>
                    <TableCell className="text-right">
                      <Text variant="number">{formatMoney(m.saldo)}</Text>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        )}
      </Stack>
    </>
  );
}
