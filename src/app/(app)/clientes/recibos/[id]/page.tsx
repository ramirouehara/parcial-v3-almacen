import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/common/print-button";
import { Row, Stack, Text, Title } from "@/components/layout/primitives";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateTime, formatDocument, formatMoney } from "@/lib/format";
import { medioPagoLabels } from "@/lib/labels";
import { requirePageUser } from "@/lib/session";
import { STORE } from "@/lib/store";
import { getPayment } from "@/services/payments";

export const metadata: Metadata = { title: "Recibo" };

/** /clientes/recibos/[id]: el recibo de pago numerado e imprimible (RF-C5). */
export default async function ReceiptPage({ params }: PageProps<"/clientes/recibos/[id]">) {
  const user = await requirePageUser();
  const { id } = await params;
  const receipt = await getPayment(user, id);

  return (
    <>
      <Row justify="between" className="no-print">
        <Link href={`/clientes/${receipt.cliente.id}`} className="text-sm text-muted-foreground hover:text-foreground">
          <Row gap={1}>
            <ArrowLeft className="size-4" /> Volver al cliente
          </Row>
        </Link>
        <PrintButton />
      </Row>
      <Card className="mx-auto w-full max-w-xl print:border-none print:shadow-none">
        <CardContent>
          <Stack gap={4}>
            <Row justify="between" align="start">
              <Stack gap={0}>
                <Title level={2}>{STORE.nombre}</Title>
                <Text variant="small">{STORE.domicilio}</Text>
                <Text variant="small">
                  CUIT {STORE.cuit} · Tel. {STORE.telefono}
                </Text>
              </Stack>
              <Stack gap={0} className="text-right">
                <Text variant="strong">RECIBO</Text>
                <Text variant="number">{receipt.numeroRecibo}</Text>
                <Text variant="small">{formatDateTime(receipt.fecha)}</Text>
              </Stack>
            </Row>
            <Separator />
            <Stack gap={1}>
              <Text>
                Recibimos de <strong>{receipt.cliente.nombre}</strong> ({receipt.cliente.tipoDoc}{" "}
                {formatDocument(receipt.cliente.tipoDoc, receipt.cliente.nroDoc)}) la suma de:
              </Text>
              <Text variant="number" className="text-3xl">
                {formatMoney(receipt.importe)}
              </Text>
              <Text variant="muted">
                Medio: {medioPagoLabels[receipt.medio]}
                {receipt.observacion ? ` · ${receipt.observacion}` : ""}
              </Text>
            </Stack>
            <Separator />
            <Row justify="between">
              <Text variant="muted">Saldo pendiente del cliente</Text>
              <Text variant="number">{formatMoney(receipt.saldoCliente)}</Text>
            </Row>
            <Text variant="small">Atendió: {receipt.usuario.nombre}</Text>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
