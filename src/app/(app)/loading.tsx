import { Stack } from "@/components/layout/primitives";
import { Skeleton } from "@/components/ui/skeleton";

// Estado "cargando" (§8): Next muestra esto solo mientras una página de
// (app) busca sus datos. El panel lateral queda; solo se reemplaza el contenido.
export default function Loading() {
  return (
    <Stack gap={4} aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-5 w-80" />
      <Skeleton className="h-64 w-full" />
    </Stack>
  );
}
