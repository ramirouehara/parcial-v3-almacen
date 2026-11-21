"use client";

/**
 * Alta o edición de un producto (RF-P2) en una ventana modal. Solo admin.
 * La existencia no se edita: al crear se puede cargar un "stock inicial", que entra
 * como un movimiento de ingreso; después solo cambia con ingresos, egresos y ventas.
 */
import { useState, type ReactNode } from "react";
import { createProductAction, updateProductAction } from "@/actions/products";
import { FormField } from "@/components/common/form-field";
import { MoneyInput } from "@/components/common/money-input";
import { Grid, Stack } from "@/components/layout/primitives";
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
import { useForm } from "@/hooks/use-form";
import { createProductSchema, updateProductSchema } from "@/schemas/products";
import type { PublicProduct } from "@/services/products";

type Category = { id: number; nombre: string };

// `stockInicial` solo existe al crear: el esquema de edición es estricto y lo rechazaría.
type Values = {
  codigo: string;
  descripcion: string;
  categoriaId: number | undefined;
  precio: number | null;
  stockMinimo: number;
  stockInicial?: number;
};

/** Un campo numérico vacío se manda como NaN, así Zod muestra "Ingresá una cantidad." */
const toNumber = (text: string) => (text === "" ? Number.NaN : Number(text));
const numberText = (value: number | undefined) => (value === undefined || Number.isNaN(value) ? "" : String(value));

export function ProductFormDialog({
  product,
  categories,
  trigger,
}: {
  product?: PublicProduct;
  categories: Category[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const editing = product !== undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            {editing ? `${product.codigo} · ${product.descripcion}` : "El stock inicial entra como un ingreso."}
          </DialogDescription>
        </DialogHeader>
        {open && <ProductForm product={product} categories={categories} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({
  product,
  categories,
  onDone,
}: {
  product?: PublicProduct;
  categories: Category[];
  onDone: () => void;
}) {
  const editing = product !== undefined;
  const initial: Values = editing
    ? {
        codigo: product.codigo,
        descripcion: product.descripcion,
        categoriaId: product.categoria.id,
        precio: product.precio,
        stockMinimo: product.stockMinimo,
      }
    : { codigo: "", descripcion: "", categoriaId: undefined, precio: null, stockMinimo: 0, stockInicial: 0 };
  const form = useForm(editing ? updateProductSchema : createProductSchema, initial);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (editing) {
      await form.submit((values) => updateProductAction(product.id, values), {
        success: "Producto actualizado.",
        onSuccess: onDone,
      });
    } else {
      await form.submit(createProductAction, { success: "Producto creado.", onSuccess: onDone });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={4}>
        <Grid cols={2}>
          <FormField label="Código" htmlFor="codigo" error={form.errors.codigo} hint="Ej.: AL-001">
            <Input
              id="codigo"
              value={form.values.codigo}
              onChange={(e) => form.setField("codigo", e.target.value)}
              aria-invalid={!!form.errors.codigo}
              className="uppercase"
            />
          </FormField>
          <FormField label="Categoría" htmlFor="categoriaId" error={form.errors.categoriaId}>
            <Select
              value={form.values.categoriaId ? String(form.values.categoriaId) : ""}
              onValueChange={(v) => form.setField("categoriaId", Number(v))}
            >
              <SelectTrigger id="categoriaId" className="w-full" aria-invalid={!!form.errors.categoriaId}>
                <SelectValue placeholder="Elegí una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </Grid>
        <FormField label="Descripción" htmlFor="descripcion" error={form.errors.descripcion}>
          <Input
            id="descripcion"
            value={form.values.descripcion}
            onChange={(e) => form.setField("descripcion", e.target.value)}
            aria-invalid={!!form.errors.descripcion}
          />
        </FormField>
        <Grid cols={2}>
          <FormField label="Precio de venta" htmlFor="precio" error={form.errors.precio} hint="Con impuestos incluidos.">
            <MoneyInput
              id="precio"
              value={form.values.precio}
              onChange={(cents) => form.setField("precio", cents)}
              invalid={!!form.errors.precio}
            />
          </FormField>
          <FormField label="Stock mínimo" htmlFor="stockMinimo" error={form.errors.stockMinimo}>
            <Input
              id="stockMinimo"
              type="number"
              min={0}
              value={numberText(form.values.stockMinimo)}
              onChange={(e) => form.setField("stockMinimo", toNumber(e.target.value))}
              aria-invalid={!!form.errors.stockMinimo}
            />
          </FormField>
        </Grid>
        {!editing && (
          <FormField
            label="Stock inicial"
            htmlFor="stockInicial"
            error={form.errors.stockInicial}
            hint="Unidades que ya hay en el local. Se registra como ingreso «Stock inicial»."
          >
            <Input
              id="stockInicial"
              type="number"
              min={0}
              value={numberText(form.values.stockInicial)}
              onChange={(e) => form.setField("stockInicial", toNumber(e.target.value))}
              aria-invalid={!!form.errors.stockInicial}
            />
          </FormField>
        )}
        <DialogFooter>
          <Button type="submit" disabled={form.pending}>
            {form.pending ? "Guardando..." : editing ? "Guardar cambios" : "Crear producto"}
          </Button>
        </DialogFooter>
      </Stack>
    </form>
  );
}
