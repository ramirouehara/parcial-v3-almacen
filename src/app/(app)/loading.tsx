import { Stack } from "@/components/layout/primitives";
import { Skeleton } from "@/components/ui/skeleton";

// "Loading" state (§8): Next shows this automatically while a page of
// (app) fetches its data. The sidebar stays; only the content is replaced.
export default function Loading() {
  return (
    <Stack gap={4} aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-5 w-80" />
      <Skeleton className="h-64 w-full" />
    </Stack>
  );
}
