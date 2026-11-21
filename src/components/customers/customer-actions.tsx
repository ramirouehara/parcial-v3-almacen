"use client";

/** Botones de cada cliente: editar y dar de baja / reactivar (RF-C2, RF-C7). */
import { toast } from "sonner";
import { Pencil, Power } from "lucide-react";
import { updateCustomerAction } from "@/actions/customers";
import { ConfirmAction } from "@/components/common/confirm-action";
import { Row } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import type { PublicCustomer } from "@/services/customers";
import { CustomerFormDialog } from "./customer-form-dialog";

export function CustomerActions({ customer }: { customer: PublicCustomer }) {
  async function toggleActive() {
    const result = await updateCustomerAction(customer.id, { activo: !customer.activo });
    if (!result.ok) {
      toast.error(result.error.message);
      return false;
    }
    toast.success(customer.activo ? "Cliente dado de baja." : "Cliente reactivado.");
    return true;
  }

  return (
    <Row gap={1} justify="end" className="flex-nowrap">
      <CustomerFormDialog
        customer={customer}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Editar a ${customer.nombre}`}>
            <Pencil />
          </Button>
        }
      />
      <ConfirmAction
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`${customer.activo ? "Dar de baja" : "Reactivar"} a ${customer.nombre}`}>
            <Power className={customer.activo ? "text-destructive" : "text-primary"} />
          </Button>
        }
        title={customer.activo ? "¿Dar de baja al cliente?" : "¿Reactivar al cliente?"}
        description={
          customer.activo
            ? "Deja de aparecer en las ventas, pero conserva su historial. Solo se puede si no debe nada."
            : "Vuelve a aparecer en las ventas."
        }
        confirmLabel={customer.activo ? "Dar de baja" : "Reactivar"}
        onConfirm={toggleActive}
      />
    </Row>
  );
}
