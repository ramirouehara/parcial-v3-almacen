import { Stack, Text, Title } from "@/components/layout/primitives";

// Temporary home page: it only proves that the theme, fonts and primitives work.
// The real dashboard (RF-T) replaces it in a later commit.
export default function HomePage() {
  return (
    <Stack gap={0} className="min-h-screen">
      <Stack gap={0} className="aguayo-stripe" />
      <Stack gap={2} className="mx-auto w-full max-w-2xl px-4 py-16">
        <Text variant="small" className="uppercase tracking-widest">
          Gestión comercial
        </Text>
        <Title level={1}>Almacén Rey Dani</Title>
        <Text variant="muted">Ventas, stock y libreta de cuentas corrientes del barrio.</Text>
      </Stack>
    </Stack>
  );
}
