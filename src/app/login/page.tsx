import type { Metadata } from "next";
import { UsersRound } from "lucide-react";
import { LoginForm } from "@/components/autenticacion/form-login";
import { Logo } from "@/components/comunes/logo";
import { Stack, Text, Title } from "@/components/maquetacion/primitivas";

export const metadata: Metadata = { title: "Iniciar sesión" };

// /login: la única página pública (RF-U2). Está fuera de la carpeta (app),
// por eso NO tiene el layout con panel lateral.
export default function LoginPage() {
  return (
    <Stack gap={0} className="min-h-screen bg-sidebar">
      <Stack gap={0} className="aguayo-stripe" />
      <Stack gap={6} className="mx-auto w-full max-w-sm flex-1 justify-center px-4 py-12">
        <Logo size={160} className="mx-auto shadow-xl ring-4 ring-sidebar-primary/50" />
        <Stack gap={1} className="text-sidebar-foreground">
          <Text variant="small" className="tracking-widest text-sidebar-primary uppercase">
            Gestión comercial
          </Text>
          <Title level={1} className="text-white">
            Almacén Rey Dani.
          </Title>
          <Text className="text-sidebar-foreground/80">Ingresá con tu email y contraseña.</Text>
        </Stack>

        <LoginForm />
      </Stack>
      <aside
        aria-label="Integrantes del grupo"
        className="mx-auto mb-4 w-[min(20rem,calc(100%-2rem))] overflow-hidden rounded-xl border border-sidebar-border bg-card text-card-foreground shadow-lg lg:fixed lg:right-4 lg:bottom-4 lg:mb-0 lg:w-80"
      >
        <div className="flex items-center justify-between gap-2 bg-sidebar px-4 py-3 text-sidebar-foreground">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <UsersRound aria-hidden="true" size={16} />
            Integrantes
          </span>
          <span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-xs font-semibold text-sidebar-accent-foreground">
            Grupo 21
          </span>
        </div>
        <ul className="space-y-2 px-4 py-3 text-sm">
          {[
            { initials: "MP", name: "Parras Mateo" },
            { initials: "UR", name: "Uehara Martorell Ramiro" },
            { initials: "BL", name: "Blanca Leandro Ezequiel" },
          ].map(({ initials, name }) => (
            <li key={name} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
              >
                {initials}
              </span>
              <span>{name}</span>
            </li>
          ))}
        </ul>
      </aside>
    </Stack>
  );
}
