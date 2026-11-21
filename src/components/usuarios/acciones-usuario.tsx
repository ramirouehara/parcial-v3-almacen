"use client";

/** Los botones de cada fila del listado de usuarios: editar, restablecer contraseña, (des)activar. */
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Pencil, Power } from "lucide-react";
import { restablecerContrasenaAccion, actualizarUsuarioAccion } from "@/acciones/usuarios";
import { ConfirmAction } from "@/components/comunes/confirmar-accion";
import { Row, Stack, Text } from "@/components/maquetacion/primitivas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PublicUser } from "@/servicios/usuarios";
import { UserFormDialog } from "./dialogo-usuario";

export function UserActions({ user }: { user: PublicUser }) {
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  async function toggleActive() {
    const result = await actualizarUsuarioAccion(user.id, { activo: !user.activo });
    if (!result.ok) {
      toast.error(result.error.message);
      return false;
    }
    toast.success(user.activo ? "Usuario desactivado." : "Usuario activado.");
    return true;
  }

  async function reset() {
    const result = await restablecerContrasenaAccion(user.id);
    if (!result.ok) {
      toast.error(result.error.message);
      return false;
    }
    setTemporaryPassword(result.data.passwordTemporal);
    return true;
  }

  return (
    <Row gap={1} justify="end" className="flex-nowrap">
      <UserFormDialog
        user={user}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Editar a ${user.nombre}`}>
            <Pencil />
          </Button>
        }
      />
      <ConfirmAction
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Restablecer contraseña de ${user.nombre}`}>
            <KeyRound />
          </Button>
        }
        title="¿Restablecer la contraseña?"
        description={`Se genera una contraseña temporal nueva para ${user.nombre}. La actual deja de funcionar.`}
        confirmLabel="Restablecer"
        onConfirm={reset}
      />
      <ConfirmAction
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${user.activo ? "Desactivar" : "Activar"} a ${user.nombre}`}
          >
            <Power className={user.activo ? "text-destructive" : "text-primary"} />
          </Button>
        }
        title={user.activo ? "¿Desactivar al usuario?" : "¿Activar al usuario?"}
        description={
          user.activo
            ? `${user.nombre} no va a poder entrar al sistema. Su historial se conserva.`
            : `${user.nombre} va a poder volver a entrar al sistema.`
        }
        confirmLabel={user.activo ? "Desactivar" : "Activar"}
        onConfirm={toggleActive}
      />

      {/* La contraseña temporal se muestra UNA sola vez (§11.3): solo se guarda su hash. */}
      <Dialog open={temporaryPassword !== null} onOpenChange={(open) => !open && setTemporaryPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contraseña temporal</DialogTitle>
            <DialogDescription>
              Pasásela a {user.nombre}. Se muestra una sola vez: anotala antes de cerrar.
            </DialogDescription>
          </DialogHeader>
          <Stack gap={1} className="rounded-md bg-muted p-4 text-center">
            <Text variant="number" className="text-2xl font-semibold select-all">
              {temporaryPassword}
            </Text>
          </Stack>
          <DialogFooter>
            <Button onClick={() => setTemporaryPassword(null)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Row>
  );
}
