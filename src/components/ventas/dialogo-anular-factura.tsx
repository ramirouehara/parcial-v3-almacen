"use client";

/** Anular una factura (RF-V9): solo admin, con motivo obligatorio. Es irreversible, por eso pide confirmación. */
import { useState } from "react";
import { Ban } from "lucide-react";
import { anularFacturaAccion } from "@/acciones/facturas";
import { FormField } from "@/components/comunes/campo-formulario";
import { Stack } from "@/components/maquetacion/primitivas";
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
import { useForm } from "@/hooks/use-formulario";
import { cancelInvoiceSchema } from "@/esquemas/facturas";

export function CancelInvoiceDialog({ invoiceId, numero }: { invoiceId: number; numero: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="no-print">
          <Ban /> Anular
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Anular la factura {numero}?</DialogTitle>
          <DialogDescription>
            Se reingresa el stock y, si fue a cuenta corriente, se acredita el total. La factura queda visible como
            anulada y no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        {open && <CancelForm invoiceId={invoiceId} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function CancelForm({ invoiceId, onDone }: { invoiceId: number; onDone: () => void }) {
  const form = useForm(cancelInvoiceSchema, { motivo: "" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await form.submit((values) => anularFacturaAccion(invoiceId, values), {
      success: "Factura anulada.",
      onSuccess: onDone,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={4}>
        <FormField label="Motivo" htmlFor="motivo" error={form.errors.motivo}>
          <Input
            id="motivo"
            autoFocus
            placeholder="Ej.: Error en la carga de cantidades"
            value={form.values.motivo}
            onChange={(e) => form.setField("motivo", e.target.value)}
            aria-invalid={!!form.errors.motivo}
          />
        </FormField>
        <DialogFooter>
          <Button type="submit" variant="destructive" disabled={form.pending}>
            {form.pending ? "Anulando..." : "Anular factura"}
          </Button>
        </DialogFooter>
      </Stack>
    </form>
  );
}
