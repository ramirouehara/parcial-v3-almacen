import Link from "next/link";
import { CalendarDays, CalendarRange, PackageMinus, Wallet } from "lucide-react";
import { PageHeader } from "@/components/comunes/encabezado-pagina";
import { EmptyState } from "@/components/comunes/estados";
import { DailySalesChart, PaymentFormsChart } from "@/components/tablero/graficos";
import { StatCard } from "@/components/tablero/tarjeta-indicador";
import { Grid, Row, Stack, Text, Title } from "@/components/maquetacion/primitivas";
import { StockCell } from "@/components/productos/celda-stock";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/formato";
import { requirePageUser } from "@/lib/sesion";
import { getDashboard } from "@/servicios/tablero";
import { listProducts } from "@/servicios/productos";

/** Inicio (/): el tablero con indicadores (RF-T1), gráficos (RF-T2) y más vendidos (RF-T3). Ambos roles. */
export default async function HomePage() {
  const user = await requirePageUser();
  const [d, restock] = await Promise.all([
    getDashboard(user),
    listProducts(user, { bajoMinimo: "true", pageSize: "5" }),
  ]);

  return (
    <>
      <PageHeader title={`Hola, ${user.nombre.split(" ")[0]}`} description="Así viene el almacén hoy." />

      <Grid cols={4}>
        <StatCard
          icon={<CalendarDays className="size-4" />}
          label="Ventas de hoy"
          value={formatMoney(d.hoy.importe)}
          detail={`${d.hoy.cantidad} factura(s)`}
        />
        <StatCard
          icon={<CalendarRange className="size-4" />}
          label="Ventas del mes"
          value={formatMoney(d.mes.importe)}
          detail={`${d.mes.cantidad} factura(s) · ticket promedio ${formatMoney(d.mes.ticketPromedio)}`}
        />
        <StatCard
          icon={<Wallet className="size-4" />}
          label="Deuda en cuentas corrientes"
          value={formatMoney(d.cuentasCorrientes.totalAdeudado)}
          detail={`${d.cuentasCorrientes.clientesConSaldo} cliente(s) con saldo`}
        />
        <StatCard
          icon={<PackageMinus className="size-4" />}
          label="Productos bajo el mínimo"
          value={String(d.bajoMinimo.cantidad)}
          detail="Para reponer"
        />
      </Grid>

      <Grid cols={2} className="lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardContent>
            <Stack gap={3}>
              <Title level={3}>Ventas diarias · últimos 30 días</Title>
              <DailySalesChart data={d.ventasDiarias} />
            </Stack>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Stack gap={3}>
              <Title level={3}>Ventas del mes por forma de pago</Title>
              {d.mes.cantidad === 0 ? (
                <Text variant="muted">Todavía no hay ventas este mes.</Text>
              ) : (
                <PaymentFormsChart data={d.porFormaDePago} />
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid cols={2}>
        <Stack gap={3}>
          <Title level={2}>Más vendidos del mes</Title>
          {d.masVendidos.length === 0 ? (
            <EmptyState title="Todavía no hay ventas este mes" />
          ) : (
            <Stack gap={0} className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.masVendidos.map((p) => (
                    <TableRow key={p.productoId}>
                      <TableCell>
                        <Link href={`/productos/${p.productoId}`} className="hover:underline">
                          <Text as="span" variant="strong">
                            {p.descripcion}
                          </Text>
                        </Link>
                        <Text variant="small">{p.codigo}</Text>
                      </TableCell>
                      <TableCell className="text-right">
                        <Text variant="number">{p.unidades}</Text>
                      </TableCell>
                      <TableCell className="text-right">
                        <Text variant="number">{formatMoney(p.importe)}</Text>
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
            <Title level={2}>Para reponer</Title>
            <Link href="/productos?bajoMinimo=true" className="text-sm text-muted-foreground hover:text-foreground">
              Ver todos
            </Link>
          </Row>
          {restock.data.length === 0 ? (
            <EmptyState title="Todo el stock está por encima del mínimo" />
          ) : (
            <Stack gap={0} className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead className="text-right">Existencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restock.data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/productos/${p.id}`} className="hover:underline">
                          <Text as="span" variant="strong">
                            {p.descripcion}
                          </Text>
                        </Link>
                        <Text variant="small">{p.codigo}</Text>
                      </TableCell>
                      <TableCell className="text-right">
                        <Text variant="number">{p.stockMinimo}</Text>
                      </TableCell>
                      <TableCell>
                        <StockCell existencia={p.existencia} bajoMinimo={false} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          )}
        </Stack>
      </Grid>
    </>
  );
}
