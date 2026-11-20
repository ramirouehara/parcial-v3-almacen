import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Stack, Text, Title } from "@/components/layout/primitives";

export const metadata: Metadata = { title: "Iniciar sesión" };

// /login: the only public page (RF-U2). It is outside the (app) folder,
// so it does NOT get the sidebar layout.
export default function LoginPage() {
  return (
    <Stack gap={0} className="min-h-screen bg-sidebar">
      <Stack gap={0} className="aguayo-stripe" />
      <Stack gap={6} className="mx-auto w-full max-w-sm flex-1 justify-center px-4 py-12">
        <Stack gap={1} className="text-sidebar-foreground">
          <Text variant="small" className="tracking-widest text-sidebar-primary uppercase">
            Gestión comercial
          </Text>
          <Title level={1} className="text-white">
            Almacén Rey Dani
          </Title>
          <Text className="text-sidebar-foreground/80">Ingresá con tu email y contraseña.</Text>
        </Stack>
        <LoginForm />
      </Stack>
    </Stack>
  );
}
