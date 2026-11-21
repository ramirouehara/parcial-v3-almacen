/**
 * Los estados "vacío" y "error" que necesita todo listado (§8 Estados completos).
 * El estado "cargando" vive en src/app/(app)/loading.tsx.
 */
import type { ReactNode } from "react";
import { CircleAlert, Inbox, Lock } from "lucide-react";
import { Stack, Text } from "@/components/maquetacion/primitivas";

function StateBox({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <Stack gap={2} className="items-center rounded-lg border border-dashed px-6 py-12 text-center">
      {icon}
      <Text variant="strong">{title}</Text>
      {children}
    </Stack>
  );
}

/** No hay nada para mostrar: lo dice e invita a hacer algo. */
export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <StateBox icon={<Inbox className="size-8 text-muted-foreground" />} title={title}>
      {description && <Text variant="muted">{description}</Text>}
    </StateBox>
  );
}

export function ErrorState({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <StateBox icon={<CircleAlert className="size-8 text-destructive" />} title={title}>
      {description && <Text variant="muted">{description}</Text>}
      {children}
    </StateBox>
  );
}

/** Se muestra a un vendedor que abre una pantalla de admin. El servicio igual respondería 403. */
export function ForbiddenState() {
  return (
    <StateBox icon={<Lock className="size-8 text-muted-foreground" />} title="Sin permiso">
      <Text variant="muted">Esta pantalla es solo para administradores.</Text>
    </StateBox>
  );
}
