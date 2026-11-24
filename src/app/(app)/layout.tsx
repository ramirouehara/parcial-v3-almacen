import { AppShell } from "@/components/marco/marco-app";
import { requirePageUser } from "@/lib/sesion";

/**
 * Layout de todas las pantallas de ADENTRO del sistema (§4): panel lateral + barra superior.
 * La carpeta "(app)" es un grupo de rutas: los paréntesis indican que no
 * aparece en la URL. /usuarios es src/app/(app)/usuarios/page.tsx.
 * /login vive fuera de esta carpeta, por eso no tiene panel lateral.
 *
 * Segunda barrera del §10.5: sin un usuario válido, redirige a /login.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requirePageUser();
  return (
    <AppShell user={user}>
      {children}
      <p className="pointer-events-none fixed right-3 bottom-2 z-10 rounded-md bg-background/90 px-2 py-1 text-right text-xs text-muted-foreground shadow-sm">
        Grupo 21 · Comisión C3
        <br />
        Parras Mateo · Uehara Martorell Ramiro · Blanca Leandro Ezequiel
      </p>
    </AppShell>
  );
}
