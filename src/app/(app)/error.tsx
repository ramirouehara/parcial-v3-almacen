"use client";

import { ErrorState } from "@/components/comunes/estados";
import { Button } from "@/components/ui/button";

// Estado "error" (§8): si una página de (app) falla, Next muestra esto en vez de
// romper toda la app. En Next 16 la función para reintentar se llama `retry`.
// (El error real queda registrado en el servidor; el usuario nunca ve el detalle.)
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
