"use client";

/** Alta o cambio de nombre de una categoría (RF-P7). Solo admin. */
import { useState, type ReactNode } from "react";
import { createCategoryAction, updateCategoryAction } from "@/acciones/productos";
import { FormField } from "@/components/comunes/campo-formulario";
import { Stack } from "@/components/maquetacion/primitivas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "@/hooks/use-formulario";
import { createCategorySchema } from "@/esquemas/productos";

export function CategoryFormDialog({
  category,
  trigger,
}: {
  category?: { id: number; nombre: string };
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
        </DialogHeader>
        {open && <CategoryForm category={category} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({ category, onDone }: { category?: { id: number; nombre: string }; onDone: () => void }) {
  const form = useForm(createCategorySchema, { nombre: category?.nombre ?? "" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (category) {
      await form.submit((values) => updateCategoryAction(category.id, values), {
        success: "Categoría actualizada.",
        onSuccess: onDone,
      });
    } else {
      await form.submit(createCategoryAction, { success: "Categoría creada.", onSuccess: onDone });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={4}>
        <FormField label="Nombre" htmlFor="nombre" error={form.errors.nombre}>
          <Input
            id="nombre"
            autoFocus
            value={form.values.nombre}
            onChange={(e) => form.setField("nombre", e.target.value)}
            aria-invalid={!!form.errors.nombre}
          />
        </FormField>
        <DialogFooter>
          <Button type="submit" disabled={form.pending}>
            {form.pending ? "Guardando..." : category ? "Guardar" : "Crear categoría"}
          </Button>
        </DialogFooter>
      </Stack>
    </form>
  );
}
