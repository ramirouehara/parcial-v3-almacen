"use client";

/**
 * Crear o editar un usuario (RF-U4) en una ventana modal.
 * Al crear se pide una contraseña temporal; al editar no (la contraseña se
 * cambia con "Restablecer contraseña" o la cambia el propio usuario en /perfil).
 */
import { useState, type ReactNode } from "react";
import { createUserAction, updateUserAction } from "@/actions/users";
import { FormField } from "@/components/common/form-field";
import { Stack } from "@/components/layout/primitives";
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
import { createUserSchema, updateUserSchema } from "@/schemas/users";
import type { PublicUser } from "@/services/users";

// `password` solo existe al crear: el esquema de edición es estricto y lo rechazaría.
type Values = { nombre: string; email: string; rol: "admin" | "vendedor"; password?: string };

export function UserFormDialog({ user, trigger }: { user?: PublicUser; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const editing = user !== undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>
            {editing ? user.email : "La contraseña es temporal: el usuario la cambia desde su perfil."}
          </DialogDescription>
        </DialogHeader>
        {/* Se monta solo mientras está abierto, así siempre arranca con valores limpios. */}
        {open && <UserForm user={user} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function UserForm({ user, onDone }: { user?: PublicUser; onDone: () => void }) {
  const editing = user !== undefined;
  const initial: Values = editing
    ? { nombre: user.nombre, email: user.email, rol: user.rol }
    : { nombre: "", email: "", rol: "vendedor", password: "" };
  // Al crear valida con createUserSchema; al editar, con updateUserSchema.
  const form = useForm(editing ? updateUserSchema : createUserSchema, initial);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (editing) {
      await form.submit((values) => updateUserAction(user.id, values), {
        success: "Usuario actualizado.",
        onSuccess: onDone,
      });
    } else {
      await form.submit(createUserAction, { success: "Usuario creado.", onSuccess: onDone });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={4}>
        <FormField label="Nombre" htmlFor="nombre" error={form.errors.nombre}>
          <Input
            id="nombre"
            value={form.values.nombre}
            onChange={(e) => form.setField("nombre", e.target.value)}
            aria-invalid={!!form.errors.nombre}
          />
        </FormField>
        <FormField label="Email" htmlFor="email" error={form.errors.email}>
          <Input
            id="email"
            type="email"
            value={form.values.email}
            onChange={(e) => form.setField("email", e.target.value)}
            aria-invalid={!!form.errors.email}
          />
        </FormField>
        <FormField label="Rol" htmlFor="rol" error={form.errors.rol}>
          <Select value={form.values.rol} onValueChange={(v) => form.setField("rol", v as Values["rol"])}>
            <SelectTrigger id="rol" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vendedor">Vendedor</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        {!editing && (
          <FormField
            label="Contraseña temporal"
            htmlFor="password"
            error={form.errors.password}
            hint="Al menos 8 caracteres."
          >
            <Input
              id="password"
              type="text"
              autoComplete="off"
              value={form.values.password ?? ""}
              onChange={(e) => form.setField("password", e.target.value)}
              aria-invalid={!!form.errors.password}
            />
          </FormField>
        )}
        <DialogFooter>
          <Button type="submit" disabled={form.pending}>
            {form.pending ? "Guardando..." : editing ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </DialogFooter>
      </Stack>
    </form>
  );
}
