import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/comunes/logo";
import { PrintButton } from "@/components/comunes/boton-imprimir";
import { Row, Stack, Text, Title } from "@/components/maquetacion/primitivas";
import { CancelInvoiceDialog } from "@/components/ventas/dialogo-anular-factura";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatDocument, formatMoney } from "@/lib/formato";
import { formaPagoLabels, tarjetaTipoLabels } from "@/lib/etiquetas";
import { requirePageUser } from "@/lib/sesion";
import { STORE } from "@/lib/comercio";
import { obtenerFactura } from "@/servicios/facturas";

export const metadata: Metadata = { title: "Factura" };

/** /ventas/[id]: el comprobante imprimible (RF-V7) y la anulación (RF-V9, solo admin). */
export default async function InvoicePage({ params }: PageProps<"/ventas/[id]">) {
  const user = await requirePageUser();
  const { id } = await params;
  const invoice = await obtenerFactura(user, id);
  const { pago } = invoice;

  return (
    <>
      <Row justify="between" className="no-print">
        <Link href="/ventas" className="text-sm text-muted-foreground hover:text-foreground">
          <Row gap={1}>
            <ArrowLeft className="size-4" /> Volver a ventas
          </Row>
        </Link>
        <Row gap={2}>
          <PrintButton />
          {user.rol === "admin" && invoice.estado === "emitida" && (
            <CancelInvoiceDialog invoiceId={invoice.id} numero={invoice.numeroFormateado} />
          )}
        </Row>
      </Row>

      {invoice.anulacion && (
        <Card className="border-destructive">
          <CardContent>
            <Text variant="strong" className="text-destructive">
              Factura anulada el {formatDateTime(invoice.anulacion.fecha)} por {invoice.anulacion.usuario.nombre}
            </Text>
            <Text variant="muted">Motivo: {invoice.anulacion.motivo}</Text>
          </CardContent>
        </Card>
      )}

      <Card className="mx-auto w-full max-w-3xl print:border-none print:shadow-none">
        <CardContent>
          <Stack gap={4}>
            <Row justify="between" align="start">
              <Row gap={3} className="flex-nowrap">
                <Logo size={64} />
                <Stack gap={0}>
                  <Title level={2}>{STORE.nombre}</Title>
                  <Text variant="small">{STORE.domicilio}</Text>
                  <Text variant="small">
                    CUIT {STORE.cuit} · {STORE.condicionIva} · Tel. {STORE.telefono}
                  </Text>
                </Stack>
              </Row>
              <Stack gap={0} className="text-right">
                <Text variant="strong">FACTURA</Text>
                <Text variant="number" className="text-lg">
                  {invoice.numeroFormateado}
                </Text>
                <Text variant="small">{formatDateTime(invoice.fecha)}</Text>
                {invoice.estado === "anulada" && (
                  <Badge variant="outline" className="text-destructive">
                    ANULADA
                  </Badge>
                )}
              </Stack>
            </Row>
            <Separator />
            <Row justify="between" align="start">
              <Stack gap={0}>
                <Text variant="small">Cliente</Text>
                {invoice.cliente ? (
                  <>
                    <Text variant="strong">{invoice.cliente.nombre}</Text>
                    <Text variant="small">
                      {invoice.cliente.tipoDoc} {formatDocument(invoice.cliente.tipoDoc, invoice.cliente.nroDoc)}
                      {invoice.cliente.domicilio ? ` · ${invoice.cliente.domicilio}` : ""}
                    </Text>
                  </>
                ) : (
                  <Text variant="strong">Consumidor final</Text>
                )}
              </Stack>
              <Stack gap={0} className="text-right">
                <Text variant="small">Vendedor</Text>
                <Text>{invoice.vendedor.nombre}</Text>
              </Stack>
            </Row>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.productoId}>
                    <TableCell>
                      <Text>{item.descripcion}</Text>
                      <Text variant="small">{item.codigo}</Text>
                    </TableCell>
                    <TableCell className="text-right">
                      <Text variant="number">{item.cantidad}</Text>
                    </TableCell>
                    <TableCell className="text-right">
                      <Text variant="number">{formatMoney(item.precioUnitario)}</Text>
                    </TableCell>
                    <TableCell className="text-right">
                      <Text variant="number">{formatMoney(item.subtotal)}</Text>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator />
            <Row justify="between" align="start">
              <Stack gap={0}>
                <Text variant="small">Forma de pago</Text>
                <Text variant="strong">{formaPagoLabels[pago.forma]}</Text>
                {pago.forma === "contado" && (
                  <Text variant="small">
                    Recibido {formatMoney(pago.montoRecibido)} · vuelto {formatMoney(pago.vuelto)}
                  </Text>
                )}
                {pago.forma === "tarjeta" && (
                  <Text variant="small">
                    {tarjetaTipoLabels[pago.tarjeta.tipo]} {pago.tarjeta.marca} terminada en {pago.tarjeta.ultimos4}
                  </Text>
                )}
                {pago.forma === "cuenta_corriente" && invoice.saldoCliente !== undefined && (
                  <Text variant="small">Saldo del cliente: {formatMoney(invoice.saldoCliente)}</Text>
                )}
              </Stack>
              <Stack gap={0} className="text-right">
                <Text variant="small">Total</Text>
                <Text variant="number" className="text-3xl font-semibold">
                  {formatMoney(invoice.total)}
                </Text>
              </Stack>
            </Row>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
