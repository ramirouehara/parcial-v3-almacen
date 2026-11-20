/**
 * The "empty" and "error" states every list needs (§8 Estados completos).
 * The "loading" state lives in src/app/(app)/loading.tsx.
 */
import type { ReactNode } from "react";
import { CircleAlert, Inbox, Lock } from "lucide-react";
import { Stack, Text } from "@/components/layout/primitives";

function StateBox({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <Stack gap={2} className="items-center rounded-lg border border-dashed px-6 py-12 text-center">
      {icon}
      <Text variant="strong">{title}</Text>
      {children}
    </Stack>
  );
}

/** Nothing to show: says so and invites to act. */
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

/** Shown to a vendedor who opens an admin screen. The service would answer 403 anyway. */
export function ForbiddenState() {
  return (
    <StateBox icon={<Lock className="size-8 text-muted-foreground" />} title="Sin permiso">
      <Text variant="muted">Esta pantalla es solo para administradores.</Text>
    </StateBox>
  );
}
