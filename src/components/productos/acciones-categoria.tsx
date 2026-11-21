"use client";

/** Botones de cada categoría (solo admin): renombrar y desactivar / reactivar (RF-P7). */
import { toast } from "sonner";
import { Pencil, Power } from "lucide-react";
import { updateCategoryAction } from "@/acciones/productos";
import { ConfirmAction } from "@/components/comunes/confirmar-accion";
import { Row } from "@/components/maquetacion/primitivas";
import { Button } from "@/components/ui/button";
import type { PublicCategory } from "@/servicios/categorias";
import { CategoryFormDialog } from "./dialogo-categoria";

export function CategoryActions({ category }: { category: PublicCategory }) {
  async function toggleActive() {
    const result = await updateCategoryAction(category.id, { activa: !category.activa });
    if (!result.ok) {
      toast.error(result.error.message);
      return false;
    }
    toast.success(category.activa ? "Categoría desactivada." : "Categoría reactivada.");
    return true;
  }

  return (
    <Row gap={1} justify="end" className="flex-nowrap">
      <CategoryFormDialog
        category={category}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Editar ${category.nombre}`}>
            <Pencil />
          </Button>
        }
      />
      <ConfirmAction
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`${category.activa ? "Desactivar" : "Reactivar"} ${category.nombre}`}>
            <Power className={category.activa ? "text-destructive" : "text-primary"} />
          </Button>
        }
        title={category.activa ? "¿Desactivar la categoría?" : "¿Reactivar la categoría?"}
        description={
          category.activa
            ? "Solo se puede si no tiene productos activos. Deja de aparecer al cargar productos."
            : "Vuelve a aparecer al cargar productos."
        }
        confirmLabel={category.activa ? "Desactivar" : "Reactivar"}
        onConfirm={toggleActive}
      />
    </Row>
  );
}
