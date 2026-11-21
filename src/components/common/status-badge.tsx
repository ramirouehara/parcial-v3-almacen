import { Badge } from "@/components/ui/badge";

/** Etiqueta de activo / inactivo, igual en todos los listados. */
export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="secondary">Activo</Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Inactivo
    </Badge>
  );
}

const roleLabels = { admin: "Administrador", vendedor: "Vendedor" } as const;

export function RoleBadge({ rol }: { rol: keyof typeof roleLabels }) {
  return rol === "admin" ? (
    <Badge className="bg-tag text-tag-foreground">{roleLabels.admin}</Badge>
  ) : (
    <Badge variant="outline">{roleLabels.vendedor}</Badge>
  );
}
