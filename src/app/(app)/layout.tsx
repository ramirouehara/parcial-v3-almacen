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
  return <AppShell user={user}>{children}</AppShell>;
}
