"use client";

/**
 * Registrar un pago a cuenta corriente (RF-C5). Ambos roles.
 * Al guardar, abre el recibo numerado para imprimirlo.
 */
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { registerPaymentAction } from "@/acciones/clientes";
import { FormField } from "@/components/comunes/campo-formulario";
import { MoneyInput } from "@/components/comunes/campo-importe";
import { Stack, Text } from "@/components/maquetacion/primitivas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "@/hooks/use-formulario";
import { formatMoney } from "@/lib/formato";
import { medioPagoLabels } from "@/lib/etiquetas";
import { mediosPago, paymentSchema } from "@/esquemas/clientes";

export function PaymentDialog({
  customer,
  trigger,
}: {
  customer: { id: number; nombre: string; saldo: number };
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            {customer.nombre} · debe {formatMoney(customer.saldo)}
          </DialogDescription>
        </DialogHeader>
        {open && <PaymentForm customer={customer} />}
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({ customer }: { customer: { id: number; saldo: number } }) {
  const router = useRouter();
  const form = useForm(paymentSchema, {
    importe: customer.saldo as number | null,
    medio: "efectivo" as (typeof mediosPago)[number],
    observacion: "",
  });
  const over = (form.values.importe ?? 0) > customer.saldo;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await form.submit((values) => registerPaymentAction(customer.id, values), {
      success: "Pago registrado.",
      onSuccess: (receipt) => router.push(`/clientes/recibos/${receipt.id}`),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={4}>
        <FormField label="Importe" htmlFor="importe" error={form.errors.importe}>
          <MoneyInput
            id="importe"
            autoFocus
            value={form.values.importe}
            onChange={(cents) => form.setField("importe", cents)}
            invalid={!!form.errors.importe || over}
          />
        </FormField>
        {over && <Text variant="error">El pago no puede superar la deuda (regla 8).</Text>}
        <FormField label="Medio" htmlFor="medio" error={form.errors.medio}>
          <Select value={form.values.medio} onValueChange={(v) => form.setField("medio", v as (typeof mediosPago)[number])}>
            <SelectTrigger id="medio" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mediosPago.map((m) => (
                <SelectItem key={m} value={m}>
                  {medioPagoLabels[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Observación (opcional)" htmlFor="observacion" error={form.errors.observacion}>
          <Input
            id="observacion"
            value={form.values.observacion ?? ""}
            onChange={(e) => form.setField("observacion", e.target.value)}
          />
        </FormField>
        <DialogFooter>
          <Button type="submit" disabled={form.pending || over}>
            {form.pending ? "Registrando..." : "Registrar pago"}
          </Button>
        </DialogFooter>
      </Stack>
    </form>
  );
}
