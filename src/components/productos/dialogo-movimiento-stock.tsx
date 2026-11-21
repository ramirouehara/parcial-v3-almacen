"use client";

/**
 * Ingreso o egreso manual de stock (RF-P4, RF-P5). Solo admin.
 * El egreso no puede dejar la existencia en negativo: lo controla moverStock() en el servidor.
 */
import { useState, type ReactNode } from "react";
import { registerMovementAction } from "@/acciones/productos";
import { FormField } from "@/components/comunes/campo-formulario";
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
import { egresoMotivos, ingresoMotivos, stockMovementSchema } from "@/esquemas/productos";

type Tipo = "ingreso" | "egreso";

export function StockMovementDialog({
  product,
  tipo,
  trigger,
}: {
  product: { id: number; descripcion: string; existencia: number };
  tipo: Tipo;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tipo === "ingreso" ? "Ingreso de stock" : "Egreso de stock"}</DialogTitle>
          <DialogDescription>
            {product.descripcion} · existencia actual: {product.existencia}
          </DialogDescription>
        </DialogHeader>
        {open && <MovementForm product={product} tipo={tipo} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function MovementForm({
  product,
  tipo,
  onDone,
}: {
  product: { id: number; existencia: number };
  tipo: Tipo;
  onDone: () => void;
}) {
  const motivos = tipo === "ingreso" ? ingresoMotivos : egresoMotivos;
  const form = useForm(stockMovementSchema, {
    tipo,
    cantidad: 1,
    motivo: motivos[0] as string,
    observacion: "",
  });
  const after = product.existencia + (tipo === "ingreso" ? 1 : -1) * (form.values.cantidad || 0);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await form.submit((values) => registerMovementAction(product.id, values), {
      success: tipo === "ingreso" ? "Ingreso registrado." : "Egreso registrado.",
      onSuccess: onDone,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={4}>
        <FormField label="Cantidad" htmlFor="cantidad" error={form.errors.cantidad}>
          <Input
            id="cantidad"
            type="number"
            min={1}
            autoFocus
            value={Number.isNaN(form.values.cantidad) ? "" : form.values.cantidad}
            onChange={(e) => form.setField("cantidad", e.target.value === "" ? Number.NaN : Number(e.target.value))}
            aria-invalid={!!form.errors.cantidad}
          />
        </FormField>
        <FormField label="Motivo" htmlFor="motivo" error={form.errors.motivo}>
          <Select value={form.values.motivo} onValueChange={(v) => form.setField("motivo", v)}>
            <SelectTrigger id="motivo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {motivos.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
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
        <Text variant={after < 0 ? "error" : "muted"}>
          {after < 0 ? "No alcanza: la existencia quedaría en negativo." : `La existencia queda en ${after}.`}
        </Text>
        <DialogFooter>
          <Button type="submit" disabled={form.pending}>
            {form.pending ? "Guardando..." : tipo === "ingreso" ? "Registrar ingreso" : "Registrar egreso"}
          </Button>
        </DialogFooter>
      </Stack>
    </form>
  );
}
