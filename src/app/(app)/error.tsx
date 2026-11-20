"use client";

import { ErrorState } from "@/components/common/states";
import { Button } from "@/components/ui/button";

// "Error" state (§8): if a page of (app) throws, Next shows this instead of
// breaking the whole app. In Next 16 the retry function is called `retry`.
// (The real error is logged on the server; the user never sees its details.)
export default function AppError({ retry }: { error: Error; retry: () => void }) {
  return (
    <ErrorState
      title="No se pudo cargar esta pantalla"
      description="Revisá tu conexión e intentá de nuevo."
    >
      <Button variant="outline" onClick={() => retry()}>
        Reintentar
      </Button>
    </ErrorState>
  );
}
