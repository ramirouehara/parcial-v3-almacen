"use client";

/**
 * Alta o edición de un cliente (RF-C2) en una ventana modal. Ambos roles.
 * La usa también Nueva venta para dar de alta un cliente sin perder la venta (RF-V2):
 * por eso avisa con `onSaved` qué cliente se creó.
 */
import { useState, type ReactNode } from "react";
import { createCustomerAction, updateCustomerAction } from "@/acciones/clientes";
import { FormField } from "@/components/comunes/campo-formulario";
import { MoneyInput } from "@/components/comunes/campo-importe";
import { Grid, Row, Stack } from "@/components/maquetacion/primitivas";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "@/hooks/use-formulario";
import { createCustomerSchema, updateCustomerSchema } from "@/esquemas/clientes";
import type { PublicCustomer } from "@/servicios/clientes";

type Values = {
  tipoDoc: "DNI" | "CUIT";
  nroDoc: string;
  nombre: string;
  domicilio: string;
  telefono: string;
  email: string;
  cuentaCorriente: boolean;
  limiteCredito: number | null;
};

export function CustomerFormDialog({
  customer,
  trigger,
  onSaved,
}: {
  customer?: PublicCustomer;
  trigger: ReactNode;
  onSaved?: (customer: PublicCustomer) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          <DialogDescription>
            {customer ? customer.nombre : "El documento (DNI o CUIT) no se puede repetir."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CustomerForm
            customer={customer}
            onDone={(saved) => {
              setOpen(false);
              onSaved?.(saved);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CustomerForm({ customer, onDone }: { customer?: PublicCustomer; onDone: (c: PublicCustomer) => void }) {
  const editing = customer !== undefined;
  const initial: Values = {
    tipoDoc: customer?.tipoDoc ?? "DNI",
    nroDoc: customer?.nroDoc ?? "",
    nombre: customer?.nombre ?? "",
    domicilio: customer?.domicilio ?? "",
    telefono: customer?.telefono ?? "",
    email: customer?.email ?? "",
    cuentaCorriente: customer?.cuentaCorriente ?? false,
    limiteCredito: customer?.limiteCredito ?? null,
  };
  const form = useForm(editing ? updateCustomerSchema : createCustomerSchema, initial);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    // El diálogo se abre también DENTRO del formulario de Nueva venta: sin esto, el
    // "submit" seguiría subiendo por el árbol de React y confirmaría la venta.
    event.stopPropagation();
    if (editing) {
      await form.submit((values) => updateCustomerAction(customer.id, values), {
        success: "Cliente actualizado.",
        onSuccess: onDone,
      });
    } else {
      await form.submit(createCustomerAction, { success: "Cliente creado.", onSuccess: onDone });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={4}>
        <Grid cols={2}>
          <FormField label="Tipo de documento" htmlFor="tipoDoc" error={form.errors.tipoDoc}>
            <Select value={form.values.tipoDoc} onValueChange={(v) => form.setField("tipoDoc", v as Values["tipoDoc"])}>
              <SelectTrigger id="tipoDoc" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DNI">DNI</SelectItem>
                <SelectItem value="CUIT">CUIT</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Número" htmlFor="nroDoc" error={form.errors.nroDoc} hint="Con o sin puntos y guiones.">
            <Input
              id="nroDoc"
              inputMode="numeric"
              value={form.values.nroDoc}
              onChange={(e) => form.setField("nroDoc", e.target.value)}
              aria-invalid={!!form.errors.nroDoc}
            />
          </FormField>
        </Grid>
        <FormField label="Nombre o razón social" htmlFor="nombre" error={form.errors.nombre}>
          <Input
            id="nombre"
            value={form.values.nombre}
            onChange={(e) => form.setField("nombre", e.target.value)}
            aria-invalid={!!form.errors.nombre}
          />
        </FormField>
        <FormField label="Domicilio (opcional)" htmlFor="domicilio" error={form.errors.domicilio}>
          <Input id="domicilio" value={form.values.domicilio} onChange={(e) => form.setField("domicilio", e.target.value)} />
        </FormField>
        <Grid cols={2}>
          <FormField label="Teléfono (opcional)" htmlFor="telefono" error={form.errors.telefono}>
            <Input
              id="telefono"
              type="tel"
              value={form.values.telefono}
              onChange={(e) => form.setField("telefono", e.target.value)}
            />
          </FormField>
          <FormField label="Email (opcional)" htmlFor="email" error={form.errors.email}>
            <Input
              id="email"
              type="email"
              value={form.values.email}
              onChange={(e) => form.setField("email", e.target.value)}
              aria-invalid={!!form.errors.email}
            />
          </FormField>
        </Grid>
        <Row gap={3} className="rounded-lg border p-3">
          <Switch
            id="cuentaCorriente"
            checked={form.values.cuentaCorriente}
            onCheckedChange={(checked) => form.setField("cuentaCorriente", checked)}
          />
          <Label htmlFor="cuentaCorriente">Habilitado para cuenta corriente (libreta)</Label>
        </Row>
        {form.values.cuentaCorriente && (
          <FormField
            label="Límite de crédito (opcional)"
            htmlFor="limiteCredito"
            error={form.errors.limiteCredito}
            hint="Vacío = sin límite."
          >
            <MoneyInput
              id="limiteCredito"
              value={form.values.limiteCredito}
              onChange={(cents) => form.setField("limiteCredito", cents)}
              invalid={!!form.errors.limiteCredito}
            />
          </FormField>
        )}
        <DialogFooter>
          <Button type="submit" disabled={form.pending}>
            {form.pending ? "Guardando..." : editing ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </DialogFooter>
      </Stack>
    </form>
  );
}
