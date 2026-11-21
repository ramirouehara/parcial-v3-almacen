"use client";

/** Botones de cada producto (solo admin): editar y dar de baja / reactivar (RF-P2, RF-P3). */
import { toast } from "sonner";
import { Pencil, Power } from "lucide-react";
import { actualizarProductoAccion } from "@/acciones/productos";
import { ConfirmAction } from "@/components/comunes/confirmar-accion";
import { Row } from "@/components/maquetacion/primitivas";
import { Button } from "@/components/ui/button";
import type { PublicProduct } from "@/servicios/productos";
import { ProductFormDialog } from "./dialogo-producto";

export function ProductActions({
  product,
  categories,
}: {
  product: PublicProduct;
  categories: { id: number; nombre: string }[];
}) {
  async function toggleActive() {
    const result = await actualizarProductoAccion(product.id, { activo: !product.activo });
    if (!result.ok) {
      toast.error(result.error.message);
      return false;
    }
    toast.success(product.activo ? "Producto dado de baja." : "Producto reactivado.");
    return true;
  }

  return (
    <Row gap={1} justify="end" className="flex-nowrap">
      <ProductFormDialog
        product={product}
        categories={categories}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Editar ${product.descripcion}`}>
            <Pencil />
          </Button>
        }
      />
      <ConfirmAction
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${product.activo ? "Dar de baja" : "Reactivar"} ${product.descripcion}`}
          >
            <Power className={product.activo ? "text-destructive" : "text-primary"} />
          </Button>
        }
        title={product.activo ? "¿Dar de baja el producto?" : "¿Reactivar el producto?"}
        description={
          product.activo
            ? "Deja de ofrecerse en las ventas, pero conserva su historial de movimientos y facturas."
            : "Vuelve a ofrecerse en las ventas."
        }
        confirmLabel={product.activo ? "Dar de baja" : "Reactivar"}
        onConfirm={toggleActive}
      />
    </Row>
  );
}
